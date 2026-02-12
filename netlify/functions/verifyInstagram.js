import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { username } = JSON.parse(event.body);

    if (!username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username is required" }),
      };
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Go to Instagram profile
    const url = `https://www.instagram.com/${username}/`;
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scrape bio & profile pic
    const data = await page.evaluate(() => {
      const bioEl = document.querySelector("meta[name='description']");
      const profilePicEl = document.querySelector("img[alt*='profile picture']");

      let bio = null;
      let profilePic = null;

      if (bioEl) {
        const content = bioEl.getAttribute("content");
        // Instagram meta description format: "X followers, Y following, Z posts - Bio text"
        bio = content.split(" - ").pop(); // grab the last part
      }

      if (profilePicEl) {
        profilePic = profilePicEl.src;
      }

      return { bio, profilePic };
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...data }),
    };
  } catch (err) {
    console.error("Error in verifyInstagram:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
