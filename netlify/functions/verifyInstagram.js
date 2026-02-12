const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

exports.handler = async (event) => {
  try {
    const { username, code } = JSON.parse(event.body);

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
    });

    await page.waitForTimeout(4000);

    const bio = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        verified: bio.includes(code),
        bio
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
