function main() {
    require('events').EventEmitter.defaultMaxListeners = 45;

    const args = require('yargs').argv;

    let archiveUrl = args.archiveUrl,
        postUrls = args.postUrls,
        postBodySelector = args.postBodySelector,
        summarySelector = args.summarySelector,
        summarySelectorAlt = args.summarySelectorAlt,
        pLoop = args.pLoop,
        contentSelector = args.contentSelector;

    const puppeteer = require('puppeteer');
    const fs = require('fs');

    //check if string ends with any of array suffixes
    function endsWithAny(suffixes, string) {
        for (let suffix of suffixes) {
            if (string.endsWith(suffix))
                return true;
        }
        return false;
    }

    let it = 0;
    let a = [];
    let jsonContent;

    let contents = fs.readFileSync("json/posts.json");
    if (contents.length != 0) {
        jsonContent = JSON.parse(contents);
    } else jsonContent = a;

    let scrapeUrls = async () => {
        const browser = await puppeteer.launch({
            headless: true
        });
        const page = await browser.newPage();

        const url = archiveUrl;
        let isDomSelectorLoaded = postUrls;

        await page.goto(url, {
            waitUntil: "networkidle2"
        });
        await page.waitForSelector(isDomSelectorLoaded);

        const result = await page.evaluate((postUrls) => {
            let pathToScrape = postUrls;
            let elements = document.querySelectorAll(pathToScrape);
            return Array.from(elements).map((element) => {
                return element.href
            });
        }, postUrls);
        await browser.close();
        return result;
    };

    scrapeUrls().then(res => {

        let resLength = res.length;
        console.log(resLength);
        const skipIfFound = ["video", "news", "infographic", "conference", "event", "webinar", "podcast", "Halloween", "Christmas", "Trump", "election", "writing course"];
        const skipIfEndsWith = ["com/", "co.uk/", "org/"];

        for (var i = 0; i < resLength; i++) {

            let skipPostEnd = endsWithAny(skipIfEndsWith, res[i]);
            let skipPost = skipIfFound.some(o => res[i].includes(o));

            if (skipPost || skipPostEnd) {
                console.log("Article skipped. \n");
                it += 1;
            } else {
                void(async () => {
                    jsonContent.push(await getThePosts(res[i]));
                    await writePostsToFile();
                    async function writePostsToFile() {
                        it += 1;
                        if (it >= resLength) {
                            fs.writeFile(
                                './json/posts.json',
                                JSON.stringify(jsonContent, null, 2),
                                (err) => err ? console.error('Data not written!', err) : console.log('Data written!')
                            )

                            return; //exit main
                        }
                    }

                })()
            }
        }
    })

    let getThePosts = async (url) => {

        let urlArrayLength = url.length;
        console.log(url);
        const browser = await puppeteer.launch();

        const page = await browser.newPage();
        await page.goto(url);

        let isDomSelectorLoaded = postBodySelector;
        await page.waitForSelector(isDomSelectorLoaded);

        const posts = await page.evaluate((postBodySelector, summarySelector, summarySelectorAlt, contentSelector, pLoop) => {
            let title = document.title;
            title = title.split('|')[0];
            title = title.split('-')[0];
            let summary = "";
            let paragraphs = [];
            let content = "";

            try {
                if (document.querySelector(contentSelector) && document.querySelector(contentSelector).childElementCount < 3) {
                    content = document.querySelector(contentSelector).innerText;
                } else throw 1; //Throw error if post content has less than 3 paragraphs to be dealt with in catch

            } catch (err) {

                if (document.querySelector(postBodySelector)) {
                    var x = document.querySelector(postBodySelector).childElementCount;

                    if (document.querySelector(summarySelector)) {
                        summary = document.querySelector(summarySelector).innerText;
                    } else if (document.querySelector(summarySelectorAlt)) {
                        summary = document.querySelector(summarySelectorAlt).innerText;
                    }

                    for (var i = pLoop; i < x; ++i) {

                        try {
                            paragraph = document.querySelector(postBodySelector + ' p:nth-child(' + i + ')').innerText;
                            if (paragraph != "") {
                                paragraphs.push("<p>" + paragraph + "</p>");
                            }
                        } catch {
                            console.log("<pre>No more paragraphs</pre>");
                        }

                        try {
                            paragraph = document.querySelector(postBodySelector + ' blockquote:nth-child(' + i + ')').innerText;
                            if (paragraph != "") {
                                paragraphs.push("<blockquote>" + paragraph + "</blockquote>");
                            }
                        } catch {
                            console.log("<pre>No more blockqoutes</pre>");
                        }

                        try {
                            paragraph = document.querySelector(postBodySelector + ' h3:nth-child(' + i + ')').innerText;
                            if (pargraph != summary) {
                                if (paragraph != "") {
                                    paragraphs.push("<h3>" + paragraph + "</h3>");
                                }
                            } else throw 1;
                        } catch {
                            console.log("<pre>No more h3</pre>");
                        }

                        try {
                            paragraph = document.querySelector(postBodySelector + ' h4:nth-child(' + i + ')').innerText;
                            if (pargraph != summary) {
                                if (paragraph != "") {
                                    paragraphs.push("<h4>" + paragraph + "</h4>");
                                }
                            } else throw 1;
                        } catch {
                            console.log("<pre>No more h4</pre>");
                        }


                        try {
                            paragraph = document.querySelector(postBodySelector + ' h5:nth-child(' + i + ')').innerText;
                            if (pargraph != summary) {
                                if (paragraph != "") {
                                    paragraphs.push("<h5>" + paragraph + "</h5>");
                                }
                            }
                        } catch {
                            console.log("<pre>No more h5</pre>");
                        }


                        try {
                            let articles = document.querySelectorAll(postBodySelector + ' ul:nth-child(' + i + ') li');
                            paragraphs.push("<ul>");
                            articles.forEach(a => {
                                if (a != "") {
                                    paragraphs.push("<li>" + a.innerHTML + "</li>");
                                }
                            });
                            paragraphs.push("</ul>");

                        } catch {
                            console.log("<pre>No more ul or lis</pre>");
                        }

                    }

                    content = paragraphs.join(" ");
                    content = content.replace(/\s{2,}/g, ' ');

                }
            }
            return {
                title,
                summary,
                content
            }
        }, postBodySelector, summarySelector, summarySelectorAlt, contentSelector, pLoop);

        await browser.close();
        console.log("Here comes a post... \n");
        return posts; // Return the data
    }
}

main();