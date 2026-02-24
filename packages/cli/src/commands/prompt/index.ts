import { Command } from "commander";
import { promptUiCommand } from "./ui.js";

export const promptCommand = new Command("prompt")
  .description("Generate prompts for AI-assisted page creation")
  .addCommand(promptUiCommand);

