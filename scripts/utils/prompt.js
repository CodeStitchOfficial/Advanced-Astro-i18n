/**
 * Prompts the user for a y/n answer, re-prompting on unrecognized input
 * instead of silently guessing. `ask` is a (promptText) => Promise<string>
 * function, decoupled from any particular readline setup.
 */
export async function askYesNo(ask, question, defaultYes = true) {
    const suffix = defaultYes ? " (Y/n): " : " (y/N): ";

    while (true) {
        const answer = (await ask(question + suffix)).trim().toLowerCase();

        if (!answer) return defaultYes;
        if (answer === "y" || answer === "yes") return true;
        if (answer === "n" || answer === "no") return false;

        console.log("Please answer y or n.");
    }
}
