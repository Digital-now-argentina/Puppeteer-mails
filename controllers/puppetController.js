const puppeteer = require('puppeteer');

var fetch = require('node-fetch');
var innertext = require('innertext');

async function puppetGetLinks(content) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://isearchfrom.com');
    await page.type('#searchinput', `${content.search}`);
    await page.type('#countrytags', `${content.countryTarget}`);
    if (content.countryTarget == "Australia" || content.countryTarget == "United States" || content.countryTarget == "United Kingdom" || content.countryTarget == "South Africa" || content.countryTarget == "Ukraine" || content.countryTarget == "India") {
        var language = "English"
    } else {
        var language = "Spanish"
    }
    await page.type('#languagetags', language);
    await page.click("#countryonly", {
        clickCount: 1
    });
    await page.click("#languageonly", {
        clickCount: 1
    });
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
    console.log(`Realizando busqueda en isearchfrom.com de "${content.search}", en lenguaje ${language}, en el país: ${content.countryTarget}`);
    await page.click("#searchbutton");
    const page2 = await newPagePromise;
    // await page2.setDefaultNavigationTimeout();
    await page2.bringToFront();

    await page2.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    // var pageCaptcha = await page2.evaluate(() => {
    //     var captcha = document.querySelectorAll('.recaptcha-checkbox-border');
    //     console.log(captcha);
    //     if (captcha) {
    //         console.log('HAY CAPTCHA!!!');
    //         return true;
    //     } else {
    //         console.log('NO HAY CAPTCHA!!!');
    //         return false;
    //     }
    // });

    // // if (pageCaptcha === true) {
    // //     console.log('CLICK EN CAPTCHA!!!');
    // //     await page2.click(".recaptcha-checkbox-border");
    // //     await page2.waitForNavigation({
    // //         waitUntil: 'networkidle0',
    // //     });
    // // }
    var limitPagination = parseInt(content.limitPage) + 1;
    var totalAnnouncesLinks = [];
    for (let i = 1; i < limitPagination; i++) {
        await page2.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        var pageAnnouncesLinks = await page2.evaluate(() => {
            var anuncios = document.querySelectorAll('.jpu5Q.NVWord.VqFMTc.p8AiDd');
            var links = [];
            if (anuncios.length >= 1) {
                anuncios.forEach(anuncio => {
                    links.push(anuncio.parentElement.childNodes[1].innerHTML);
                });
            }
            return links;
        });
        console.log(`Anuncios en página ${i}:`);
        console.log(pageAnnouncesLinks);

        pageAnnouncesLinks.forEach(announceLink => {
            if (!totalAnnouncesLinks.includes(announceLink)) {
                totalAnnouncesLinks.push(announceLink)
            }

        });
        await page2.click("#pnnext");
    }

    console.log(totalAnnouncesLinks);
    // await page2.screenshot({
    //     path: 'google.jpg'
    // });
    await browser.close();
    return Promise.resolve(totalAnnouncesLinks);
}

async function puppetGetMails(array) {

    var foundMailsArray = [];
    var finalMailsArray = [];
    for (let i = 0; i < array.length; i++) {
        var response;
        fetch(array[i])
            .then(function (response) {
                return response.text();
            }).then(function (html) {
                var textResponse = innertext(html);
                foundMailsArray = textResponse.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);

                if (foundMailsArray) {
                    foundMailsArray.forEach((mail) => {
                        if (!finalMailsArray.includes(mail) && (!mail.split('.').includes('png') || !mail.split('.').includes('jpg') || !mail.split('.').includes('jpeg') || !mail.split('.').includes('wixpress'))) {
                            finalMailsArray.push(mail)
                            console.log(mail)
                        }
                    })
                }
                return Promise.resolve(finalMailsArray);

            }).catch(function (err) {
                console.warn('Something went wrong!!', err);
            });
    };
}

const puppetController = {
    index: function (req, res, next) {
        res.render('index', {
            title: 'Tool Mail Scrapping'
        });
    },
    getLinks: async function (req, res, next) {
        let totalAnnouncesLinks;
        try {
            totalAnnouncesLinks = await puppetGetLinks(req.body);
        } catch (error) {
            console.log(error)
        }

        res.render('links', {
            title: 'Tool Mail Scrapping - Links',
            links: totalAnnouncesLinks
        })

    },
    getMails: async function (req, res, next) {
        var linksToScrap = req.body.links.split(',');
        let totalMailsList;
        try {
            totalMailsList = await puppetGetMails(linksToScrap);
        } catch (error) {
            console.log(error)
        }
        res.render('mails', {
            title: 'Tool Mail Scrapping - Mails',
            mails: totalMailsList
        })
    }
}

module.exports = puppetController;