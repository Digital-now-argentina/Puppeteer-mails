const puppeteer = require('puppeteer');
var fetch = require('node-fetch');
var innertext = require('innertext');
var fs = require('fs');

/*---Funcion encargada de buscar en ISearchFrom.com---*/
async function puppetISearchLinks(content) {

    var searchQueriesArray = content.search.replace(/\r\n/g, "\n").split("\n");

    console.log(`(${searchQueriesArray.length}) Los terminos a buscar son:`);
    console.table(searchQueriesArray);

    var allUrlsFound = [];

    async function puppetISearchGetQueryLinks(query) {

        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 25,
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
        
        await page.goto('http://isearchfrom.com');
        await page.type('#searchinput', `${query}`);
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
        console.log(`(${searchQueriesArray.indexOf(query)} / ${searchQueriesArray.length}) Realizando busqueda en isearchfrom.com de "${query}", en lenguaje ${language}, en el país: ${content.countryTarget}`);
        await page.click("#searchbutton");

        const page2 = await newPagePromise;

        await page2.waitForNavigation({
            waitUntil: ['networkidle2']
        });

        await page2.bringToFront();

        await page2.setDefaultNavigationTimeout(60000);

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
            await page2.waitForSelector('#pnnext', {
                    timeout: 600000
                })
                .then(async () => {
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
                    console.log(`${pageAnnouncesLinks.length} Anuncios en página ${i} / ${content.limitPage} de "${query}":`);
                    console.table(pageAnnouncesLinks);

                    pageAnnouncesLinks.forEach(announceLink => {
                        if (!totalAnnouncesLinks.includes(announceLink)) {
                            totalAnnouncesLinks.push(announceLink)
                        }
                        if (!allUrlsFound.includes(announceLink)) {
                            allUrlsFound.push(announceLink)
                        }

                    });
                    await page2.click("#pnnext");
                });

        }

        console.log(`(${totalAnnouncesLinks.length}) Links totales encontrados con anuncios para "${query}":`);
        console.table(totalAnnouncesLinks);

        await browser.close();

    }

    for await (let query of searchQueriesArray) {
        const totalAnnouncesLinks = await puppetISearchGetQueryLinks(query);
    }

    console.log(`(${searchQueriesArray.length} / ${searchQueriesArray.length}) LLEGO AL FINAL, BUSCO TODO LOS TERMINOS Y ENCONTRO ${allUrlsFound.length} URLS CON ANUNCIOS:`)
    console.table(allUrlsFound)
    return Promise.resolve(allUrlsFound);

}

/*---Funcion encargada de buscar directamente en Google---*/
async function puppetGoogleLinks(content) {

    var searchQueriesArray = content.search.replace(/\r\n/g, "\n").split("\n");

    console.log(`(${searchQueriesArray.length}) Los terminos a buscar son:`);
    console.table(searchQueriesArray);

    var allUrlsFound = [];

    async function puppetGoogleGetQueryLinks(query) {

        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 25,
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(80000);

        // await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
        
        await page.goto('http://www.google.com');

        await page.waitForSelector('.gNO89b');
        await page.waitForSelector('.gLFyf.gsfi');

        console.log(`(${searchQueriesArray.indexOf(query)} / ${searchQueriesArray.length}) Realizando busqueda en Google.com de "${query}"`);

        await page.type('.gLFyf.gsfi', `${query}`);


        await page.click('.gNO89b');

        await page.screenshot({
            path: './screenshots/captchaPresentOrNot.jpg'
        });

        var limitPagination = parseInt(content.limitPage) + 1;
        var totalAnnouncesLinks = [];
        for (let i = 1; i < limitPagination; i++) {
            await page.waitForSelector('#pnnext', {
                    timeout: 600000
                })
                .then(async () => {
                    await page.screenshot({
                        path: `./screenshots/lastrun--page${i}.jpg`,
                        fullPage: true
                    });
                    var pageAnnouncesLinks = await page.evaluate(() => {
                        var anuncios = document.querySelectorAll('.jpu5Q.NVWord.VqFMTc.p8AiDd');
                        var links = [];
                        if (anuncios.length >= 1) {
                            anuncios.forEach(anuncio => {
                                var arrayLink = anuncio.parentElement.childNodes[1].innerHTML.split('/');
                                links.push(`${arrayLink[0]}//${arrayLink[2]}/`);
                            });
                        }
                        return links;
                    });
                    console.log(`${pageAnnouncesLinks.length} Anuncios en página ${i} / ${content.limitPage} de "${query}":`);
                    console.table(pageAnnouncesLinks);

                    pageAnnouncesLinks.forEach(announceLink => {
                        if (!totalAnnouncesLinks.includes(announceLink)) {
                            totalAnnouncesLinks.push(announceLink)
                        }
                        if (!allUrlsFound.includes(announceLink)) {
                            allUrlsFound.push(announceLink)
                        }

                    });
                    await page.click("#pnnext");
                });

        }

        console.log(`(${totalAnnouncesLinks.length}) Links totales encontrados con anuncios para "${query}":`);
        console.table(totalAnnouncesLinks);

        await browser.close();

    }

    for await (let query of searchQueriesArray) {
        const totalAnnouncesLinks = await puppetGoogleGetQueryLinks(query);
    }

    console.log(`(${searchQueriesArray.length} / ${searchQueriesArray.length}) LLEGO AL FINAL, BUSCO TODO LOS TERMINOS Y ENCONTRO ${allUrlsFound.length} URLS CON ANUNCIOS:`)
    console.table(allUrlsFound)
    return Promise.resolve(allUrlsFound);

}

/*---Funcion encargada de conseguir los mails de las urls con anuncios obtenidas---*/
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

    console.log(`(${finalMailsArray.length}) Listado de mails encontrados en esas urls:`);
    console.table(finalMailsArray);


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

        if (req.body.searchMethod == 'google') {
            try {
                totalAnnouncesLinks = await puppetGoogleLinks(req.body);
            } catch (error) {
                console.log(error)
            }
        } else {
            try {
                totalAnnouncesLinks = await puppetISearchLinks(req.body);
            } catch (error) {
                console.log(error)
            }
        }


        res.render('links', {
            title: 'Tool Mail Scrapping - Links',
            search: req.body.search.replace(/\r\n/g, ", "),
            links: totalAnnouncesLinks,
            country: req.body.countryTarget
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
            mails: totalMailsList,
            country: req.body.country
        })
    },
    saveMails: async function (req, res, next) {
        var totalMails = req.body.mailcount;
        var country = req.body.country;
        var newMailsSelected = [];

        for (let i = 0; i < totalMails; i++) {

            if (req.body[`save${i}`]) {
                newMailsSelected.push({
                    url: req.body[`url${i}`],
                    mail: req.body[`mail${i}`],
                    country: country
                });
            }
        }

        console.log(newMailsSelected);

        try {
            console.log('Leyendo JSONBin.....');
            var rawResponse;
            var contentJSONBin;
            async function getJSONBin() {
                rawResponse = await fetch('https://api.jsonbin.io/v3/b/615f424a4a82881d6c5ccbf8/latest', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Master-Key': '$2b$10$HJyBh9kHco7lKMRGVLfDNuO9AJ0YnwXgkQSC/wvKTWZ3YELQ232Me'
                    }
                });
                return rawResponse.json();
            };
            var contentJSONBin = await getJSONBin();

            // console.log(contentJSONBin.record)

            var notRepeatedMails = [];
            for (let i = 0; i < newMailsSelected.length; i++) {
                if (!contentJSONBin.record.mails || (Array.isArray(contentJSONBin.record.mails) && !contentJSONBin.record.mails.some(mails => mails.mail === newMailsSelected[i].mail))) {
                    notRepeatedMails.push(newMailsSelected[i]);
                }
            }
            console.log(`(${notRepeatedMails.length}) Los mails NO repetidos a agregar serían:`);
            console.table(notRepeatedMails);

            if (notRepeatedMails.length > 0) {
                //Saving new results
                try {
                    var updatedMails = [...notRepeatedMails, ...contentJSONBin.record.mails];
                    var readyUpdatedMails = updatedMails.sort((a, b) => (a.mail > b.mail) ? 1 : -1);
                    console.log(`(${readyUpdatedMails.length}) Por actualizar el listado en JSONBin: ${notRepeatedMails.length} mails nuevos, ${readyUpdatedMails.length - notRepeatedMails.length} mails ya guardados.`);
                    // console.table(readyUpdatedMails);

                    var saveRawResponse;

                    const jsonToSave = JSON.stringify({
                        mails: [...readyUpdatedMails]
                    });

                    async function postJSONBin() {
                        console.log('Guardando data en JSONBin.....');
                        saveRawResponse = await fetch('https://api.jsonbin.io/v3/b/615f424a4a82881d6c5ccbf8', {
                            method: 'PUT',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'X-Bin-Versioning': 'false',
                                'X-Master-Key': '$2b$10$HJyBh9kHco7lKMRGVLfDNuO9AJ0YnwXgkQSC/wvKTWZ3YELQ232Me'
                            },
                            body: jsonToSave
                        });
                        return saveRawResponse;

                    };
                    var responsePost = await postJSONBin();

                    var responsePostText = await responsePost.text();

                    // console.log(responsePostText);

                    if (responsePost.status == 200) {
                        console.log('----Guardó correctamente en JSON Bin los resultados!----')
                    }

                } catch (error) {
                    console.log(error);
                }
            }



        } catch (error) {
            console.log(error)
        }


        res.render('results', {
            title: 'Tool Mail Scrapping - Results',
            jsonbin: contentJSONBin.record.mails,
            addedmails: notRepeatedMails
        })
    },
    consultBin: async function (req, res, next) {
        try {
            console.log('Leyendo JSONBin.....');
            var rawResponse;
            var contentJSONBin;
            async function getJSONBin() {
                rawResponse = await fetch('https://api.jsonbin.io/v3/b/615f424a4a82881d6c5ccbf8/latest', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Master-Key': '$2b$10$HJyBh9kHco7lKMRGVLfDNuO9AJ0YnwXgkQSC/wvKTWZ3YELQ232Me'
                    }
                });
                return rawResponse.json();
            };
            var contentJSONBin = await getJSONBin();

        } catch (error) {
            console.log(error)
        }

        res.render('consult', {
            title: 'Tool Mail Scrapping - Consult',
            jsonbin: contentJSONBin.record.mails
        })
    },
    testVpn: async function (req, res, next) {
        try {
            let countryNames = ['Argentina', 'Australia', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Costa Rica', 'Ecuador', 'El Salvador', 'Spain', 'United States', 'Philippines', 'Guatemala', 'Honduras', 'India', 'United Kingdom', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Dominican Republic', 'South Africa', 'Ukraine', 'Uruguay', 'Venezuela'];
            let countryCodes = ['ar', 'au', 'bo', 'br', 'cl', 'co', 'cr', 'ec', 'sv', 'es', 'us', 'ph', 'gt', 'hn', 'in', 'uk', 'mx', 'ni', 'pa', 'py', 'pe', 'do', 'za', 'ua', 'uy', 've'];

            var proxyList = [];

            console.log('Testing VPN setup....');
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    // '--proxy-server=socks4://191.98.194.97:4145',
                    '--no-sandbox',
                    // '--headless',
                    '--disable-gpu',
                    '--window-size=1920x1080'
                ]
            });
            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(80000);

            // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

            await page.goto('https://www.ipaddress.my');

            await page.screenshot({
                path: './screenshots/testIpVpn.jpg'
            });

            const page2 = await browser.newPage();

            await page2.setDefaultNavigationTimeout(80000);

            await page2.goto('http://www.google.com');

            await page2.screenshot({
                path: './screenshots/testGoogleVpn.jpg'
            });

            await browser.close();


        } catch (error) {
            console.log(error)
        }

        res.redirect('/');
    }
}

module.exports = puppetController;