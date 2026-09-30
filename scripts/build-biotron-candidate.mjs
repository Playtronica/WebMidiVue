import {execFileSync} from "node:child_process"
import {createHash} from "node:crypto"
import {readdirSync, readFileSync, statSync, writeFileSync} from "node:fs"
import {relative, resolve} from "node:path"
import {pathToFileURL} from "node:url"

const root = resolve(import.meta.dirname, "..")

const git = (...args) => execFileSync("/usr/bin/git", args, {
  cwd: root, encoding: "utf8",
}).trim()

function filesBelow(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? filesBelow(path) : [path]
  })
}

export function createReleaseEvidence(distDir, {commit, branch, builtAt}) {
  const files = filesBelow(distDir)
    .filter(path => !path.endsWith("/release-evidence.json"))
    .map(path => ({
      path: relative(distDir, path).split("\\").join("/"),
      bytes: statSync(path).size,
      sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
  return {
    schema: "playtronica.biotron-beta-release-evidence.v1",
    product: "biotron",
    mode: "biotron-beta",
    commit,
    build_id: commit.slice(0, 12),
    branch,
    built_at: builtAt,
    source_clean: true,
    firmware_update_enabled: false,
    release_gate: "npm run test:biotron",
    files,
  }
}

export function main() {
  const dirty = git("status", "--porcelain")
  if (dirty) throw new Error(`Refusing candidate build from a dirty checkout:\n${dirty}`)
  const commit = git("rev-parse", "HEAD")
  const branch = git("branch", "--show-current") || "detached"
  const buildId = commit.slice(0, 12)
  execFileSync("npm", ["run", "test:biotron"], {
    cwd: root,
    env: {...process.env, VUE_APP_BUILD_ID: buildId},
    stdio: "inherit",
  })
  const distDir = resolve(root, "dist")
  const bundles = filesBelow(distDir).filter(path => path.endsWith(".js"))
  if (!bundles.some(path => readFileSync(path, "utf8").includes(buildId))) {
    throw new Error(`Built beta does not expose expected build id ${buildId}`)
  }
  const manifest = createReleaseEvidence(distDir, {
    commit, branch, builtAt: new Date().toISOString(),
  })
  writeFileSync(resolve(distDir, "release-evidence.json"), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify({
    status: "candidate_ready",
    commit,
    build_id: buildId,
    files: manifest.files.length,
    manifest: "dist/release-evidence.json",
  }, null, 2))
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ""
if (import.meta.url === invokedPath) main()
