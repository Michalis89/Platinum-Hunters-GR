import { chromium } from "playwright";
import { calculateTotalPoints, extractBackgroundColor, extractNumericValue } from "./utils";
import { TrophiesRecord } from "@/types/interfaces";

export default async function scrapePSNGuide(url: string) {
  try {
    const isHeadless = process.env.HEADLESS_MODE === "true";

    const browser = await chromium.launch({
      headless: isHeadless,
      slowMo: isHeadless ? 0 : 300,
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    try {
      const cookieBanner = await page.locator("div[role='dialog']"); //NOSONAR
      if (await cookieBanner.isVisible()) {
        console.log("✅ Βρέθηκε cookie banner!");
        const acceptButton = await page.locator("button:has-text('Accept')"); //NOSONAR
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          console.log("✔️ Πατήθηκε το κουμπί αποδοχής cookies");
        }
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log("🚫 Δεν βρέθηκε cookie banner, συνεχίζουμε...", error);
    }

    const title = await page.evaluate(() => {
      const rawTitle = document.querySelector(".title-author h3")?.textContent?.trim() ?? "Unknown";
      return rawTitle.replace(/ Trophy Guide$/, "");
    });

    const difficulty = await extractNumericValue(page, ".overview-info .tag:nth-child(1)");
    const difficultyColor = await extractBackgroundColor(page, ".overview-info .tag:nth-child(1)");

    const playthroughs = await extractNumericValue(page, ".overview-info .tag:nth-child(2)");
    const playthroughsColor = await extractBackgroundColor(
      page,
      ".overview-info .tag:nth-child(2)"
    );

    const hours = await extractNumericValue(page, ".overview-info .tag:nth-child(3)");
    const hoursColor = await extractBackgroundColor(page, ".overview-info .tag:nth-child(3)");

    const gameImage = await page
      .$eval(".game.lg img", (img: HTMLImageElement) => img.src)
      .catch(() => "Δεν βρέθηκε");

    const platform = await page
      .$eval(".platforms span", (el) => el.textContent?.trim() ?? "Άγνωστη")
      .catch(() => "Άγνωστη");

    const trophyTypes = ["Platinum", "Gold", "Silver", "Bronze"];
    const trophyCounts = await page.$$eval(".trophy-count li", (elements) =>
      elements.map((el) => el.textContent?.trim() ?? "0")
    );

    const trophies: TrophiesRecord = trophyCounts.reduce(
      (acc: TrophiesRecord, count, index) => {
        acc[trophyTypes[index] as keyof TrophiesRecord] = count;
        return acc;
      },
      { Platinum: "0", Gold: "0", Silver: "0", Bronze: "0" }
    );

    const steps = await page.$$eval("[id^='roadmapStep']", (stageElements) => {
      const seenTitles = new Set();

      return stageElements
        .map((stageEl) => {
          const titleEl = stageEl.querySelector("h1");
          const descriptionEl = stageEl.querySelector(".fr-view.step-original.guide");
          const trophyContainer = stageEl.querySelector(".roadmap-intended-trophies");

          const stageTitle = titleEl?.textContent?.trim() ?? "Άγνωστο Stage";
          if (trophyContainer) {
            trophyContainer.remove();
          }
          let stageDescription = descriptionEl?.textContent?.trim() ?? "Δεν βρέθηκε περιγραφή";
          if (stageDescription.startsWith(stageTitle)) {
            stageDescription = stageDescription.replace(stageTitle, "").trim();
          }

          const trophyElements = trophyContainer
            ? trophyContainer.querySelectorAll(".trophy.flex.v-align")
            : [];
          const trophies = Array.from(trophyElements).map((trophyEl) => {
            const name = trophyEl.querySelector(".title")?.textContent?.trim() ?? "Άγνωστο τρόπαιο";
            const description =
              trophyEl.querySelector(".small-info")?.textContent?.trim() ?? "Δεν υπάρχει περιγραφή";
            const typeImg = trophyEl.querySelector("img")?.getAttribute("src") ?? "";
            let type = "Unknown";
            if (typeImg.includes("bronze")) type = "Bronze";
            else if (typeImg.includes("silver")) type = "Silver";
            else if (typeImg.includes("gold")) type = "Gold";
            else if (typeImg.includes("platinum")) type = "Platinum";
            return { name, description, type };
          });

          if (seenTitles.has(stageTitle)) return null;
          seenTitles.add(stageTitle);
          return { title: stageTitle, description: stageDescription, trophies };
        })
        .filter((stage) => stage !== null);
    });

    await browser.close();

    return {
      title,
      difficulty,
      difficultyColor,
      playthroughs,
      playthroughsColor,
      hours,
      hoursColor,
      gameImage,
      platform,
      trophies,
      totalPoints: calculateTotalPoints(trophies),
      steps,
    };
  } catch (error) {
    console.error("❌ Σφάλμα στο scraping:", error);
    return null;
  }
}
