#!/usr/bin/env node
import TaskRunner from "./TaskRunner";
import {
  imageResource,
  screen,
  getWindows,
  Region,
  keyboard,
  Key,
  sleep,
  mouse,
  Point,
} from "@nut-tree-fork/nut-js";
import { OptionsSearchParameterType } from "@udarrr/template-matcher/dist/lib/types";
import "@udarrr/template-matcher";

type STATE = "IDLE" | "THROWING" | "FISHING" | "CATCHING";

const DEBUG = true;

let fishingArea: Region | null = null;

new TaskRunner(async () => {
  let state: STATE = "IDLE";
  try {
    while (state === "IDLE") {
      console.log("State", state);
      const window = await (
        await getWindows()
      ).find(async (w) => (await w.title) === "World of Warcraft")?.region;
      const canFish = await imageResource("images/throw.png");
      const canThrow = await screen?.find<OptionsSearchParameterType>(canFish, {
        confidence: 0.8,
        searchRegion: window,
      });

      if (canThrow) {
        state = "THROWING";
      }
    }
    while (state === "THROWING") {
      console.log("State", state);
      await keyboard.pressKey(Key.LeftShift);
      await keyboard.pressKey(Key.Num6);
      await keyboard.releaseKey(Key.LeftShift);
      await keyboard.releaseKey(Key.Num6);
      await sleep(2000);
      state = "FISHING";
    }
    while (state === "FISHING") {
      try {
        console.log("State", state);
        const window = await (
          await getWindows()
        ).find(async (w) => (await w.title) === "World of Warcraft")?.region;
        const isFishing = await imageResource("images/fishing.png");
        if (!window) {
          throw new Error("Window not found");
        }
        const searchRegion = new Region(
          window.width / 2 - 250,
          window.height / 2 - 250,
          500,
          500
        );
        DEBUG && (await screen?.highlight(searchRegion));
        const fishing = await screen?.find<OptionsSearchParameterType>(
          isFishing,
          {
            confidence: 0.6,
            searchRegion: searchRegion,
          }
        );
        fishingArea = new Region(fishing.left, fishing.top, 35, 35);
        DEBUG && (await screen?.highlight(fishingArea));
      } catch (error) {
        state = "CATCHING";
      }
    }
    while (state === "CATCHING") {
      console.log("State", state);
      if (!fishingArea) {
        throw new Error("Fishing area not found");
      }
      await mouse.move([new Point(fishingArea.left, fishingArea.top)]);
      await mouse.leftClick();
      await sleep(2000);
      state = "IDLE";
    }
  } catch (err) {
    console.error("error", err);
  }
});
