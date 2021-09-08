const puppeteer = require('puppeteer');

var fetch = require('node-fetch');
var innertext = require('innertext');

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var fs = require('fs');

async function puppetGetLinks(content) {

    const browser = await puppeteer.launch({
        slowMo: 25,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });
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
    await page2.setDefaultNavigationTimeout(60000);
    await page2.bringToFront();

    await page2.screenshot({
        path: './screenshots/captchaPresentOrNot.jpg'
    });

    // var isCaptchaPresent = false;
    // var pageCaptcha = await page2.evaluate(() => {
    //     var captcha = document.querySelectorAll('.recaptcha-checkbox-border');
    //     console.log(captcha);
    //     if (captcha) {
    //         console.log('HAY CAPTCHA!!!');
    //         isCaptchaPresent = true;
    //         return true;
    //     } else {
    //         console.log('NO HAY CAPTCHA!!!');
    //         isCaptchaPresent = false;
    //         return false;
    //     }
    // });

    // if (isCaptchaPresent) {
    //     console.log('CLICK EN CAPTCHA!!!');
    //     await page2.click(".recaptcha-checkbox-border");

    // }

    var limitPagination = parseInt(content.limitPage) + 1;
    var totalAnnouncesLinks = [];
    for (let i = 1; i < limitPagination; i++) {
        await page2.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        await page2.screenshot({
            path: `./screenshots/lastrun--page${i}.jpg`,
            fullPage: true
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

    console.log(`(${totalAnnouncesLinks.length}) Links totales encontrados con anuncios: ${totalAnnouncesLinks}`);

    await browser.close();
    return Promise.resolve(totalAnnouncesLinks);
}

async function puppetGetMails(array) {

    var foundMailsArray = [];
    var finalMailsArray = [];
    var arrayResultsJS = [];
    var arrayResultsToSave = [];
    async function fetchUrl(url) {
        try {
            var response = await fetch(url);
            var html = await response.text();
            var textResponse = await innertext(html);
            foundMailsArray = textResponse.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi);
            //Anterior regex: (/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)
            if (foundMailsArray) {
                foundMailsArray.forEach((mail) => {
                    mail = mail.toLowerCase();
                    if (!finalMailsArray.includes(mail) && (!mail.split('.').includes('png') && !mail.split('.').includes('jpg') && !mail.split('.').includes('jpeg') && !mail.split('.').includes('wixpress') && !mail.split('@').includes('legal') && !mail.split(/[.@]/).includes('sentry') && !mail.split('.').includes('vtex') && !mail.includes('u003e'))) {
                        finalMailsArray.push(mail)
                        arrayResultsJS.push({
                            url: url,
                            mail: mail
                        })
                        console.log({
                            url: url,
                            mail: mail
                        })
                    }
                })
            } else {
                console.log(`No hay mails en la url ${url}`)
            }
        } catch (err) {
            console.warn(`Something went wrong!! fetching ${url}`, err);
        }
    }


    for await (let link of array) {
        const mailsInUrl = await fetchUrl(link);
    }


    // Guarda resultados en txt temporalmente
    arrayResultsJS.forEach(resultado => {
        if (!arrayResultsToSave.includes(JSON.stringify(resultado))) {
            arrayResultsToSave.push(JSON.stringify(resultado))
        }

    });
    console.log('Deberia haber guardado resultados en results.txt');
    fs.writeFile('results.txt', arrayResultsToSave.toString(), function (err) {
        if (err) return console.log(err);
    });

    console.log(`(${finalMailsArray.length}) Listado de mails encontrados en esas urls: ${finalMailsArray}`);


    return Promise.resolve(arrayResultsJS);
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
            search: req.body.search,
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
    },
    saveMails: async function (req, res, next) {
        var totalMails = req.body.mailcount;
        console.log(totalMails);
        for (let i=0; i < totalMails; i++) {
            console.log(req.body[`url${i}`]);
            console.log(req.body[`mail${i}`]);
            console.log(req.body[`save${i}`]);
        }

        try {
            console.log('Leyendo JSONBin.....');
            var rawResponse;
            var content;
            (async () => {
                rawResponse = await fetch('https://api.jsonbin.io/v3/b/613789b4dfe0cf16eb56a89a/latest', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        "X-Master-Key": "$2b$10$Con2dje0wqb0I5A7SCsfcOVYnGg7KZKuLyka00bom1AQTwjWwOPAi"
                    }
                });
                content = await rawResponse.json();

                console.log(content.record);
            })();

        } catch (error) {
            console.log(error)
        }

        res.render('results', {
            title: 'Tool Mail Scrapping - Results'
        })
    }
}

module.exports = puppetController;