import { promises as fs } from "fs";
import { join, dirname } from "path";
import { spawn } from "child_process";
import os from "os";

/**
 * Creates a temporary directory populated with the given files.
 * @param {Record<string, string>} files  relative-path → content
 * @returns {Promise<string>} absolute path to the temp dir
 */
export async function createFixture(files) {
	const dir = await fs.mkdtemp(join(os.tmpdir(), "astro-scripts-test-"));
	for (const [relPath, content] of Object.entries(files)) {
		const abs = join(dir, relPath);
		await fs.mkdir(dirname(abs), { recursive: true });
		await fs.writeFile(abs, content, "utf8");
	}
	return dir;
}

/** Recursively deletes a fixture directory. */
export async function cleanupFixture(dir) {
	await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Runs a script as a child process with optional piped stdin.
 * @param {string}   scriptPath  absolute path to the .js file
 * @param {string[]} args        CLI arguments
 * @param {{ stdin?: string, env?: Record<string,string> }} opts
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export function runScript(scriptPath, args = [], { stdin = "", env = {} } = {}) {
	return new Promise((resolve) => {
		const child = spawn("node", [scriptPath, ...args], {
			env: { ...process.env, ...env },
			stdio: ["pipe", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d) => (stdout += d));
		child.stderr.on("data", (d) => (stderr += d));
		child.stdin.write(stdin);
		child.stdin.end();
		child.on("close", (code) => resolve({ code, stdout, stderr }));
	});
}

/** Returns true if the file exists inside the fixture dir. */
export async function fileExists(dir, relPath) {
	try {
		await fs.access(join(dir, relPath));
		return true;
	} catch {
		return false;
	}
}

/** Reads a file inside the fixture dir (UTF-8). */
export async function readFile(dir, relPath) {
	return fs.readFile(join(dir, relPath), "utf8");
}
