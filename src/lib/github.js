import { Octokit } from '@octokit/rest'

let octokit = null
let owner = null
let repo = null

export function init(token) {
  octokit = new Octokit({ auth: token })
}

export function setRepo(ownerVal, repoVal) {
  owner = ownerVal
  repo = repoVal
}

export function getRepo() {
  return owner && repo ? `${owner}/${repo}` : null
}

export async function getUser() {
  const { data } = await octokit.rest.users.getAuthenticated()
  return data
}

export async function listContents(path = '') {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  const items = Array.isArray(data) ? data : [data]
  return items
    .filter(i => i.type === 'dir' || i.name.endsWith('.md'))
    .filter(i => !i.name.startsWith('.'))
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
}

function decode(base64) {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))))
}

async function getDefaultBranch() {
  const { data } = await octokit.rest.repos.get({ owner, repo })
  return data.default_branch
}

// Latest commit on the default branch with every file in its tree.
export async function getTree() {
  const branch = await getDefaultBranch()
  const { data } = await octokit.rest.repos.getBranch({ owner, repo, branch })
  const treeSha = data.commit.commit.tree.sha
  const { data: tree } = await octokit.rest.git.getTree({ owner, repo, tree_sha: treeSha, recursive: 'true' })
  const files = {}
  for (const item of tree.tree) {
    if (item.type === 'blob') files[item.path] = { sha: item.sha, mode: item.mode }
  }
  return { branch, commitSha: data.commit.sha, treeSha, files }
}

export async function getBlob(sha) {
  const { data } = await octokit.rest.git.getBlob({ owner, repo, file_sha: sha })
  return decode(data.content)
}

export async function getBlobBase64(sha) {
  const { data } = await octokit.rest.git.getBlob({ owner, repo, file_sha: sha })
  return data.content.replace(/\n/g, '')
}

// Creates one commit on top of `remote` with the given tree entries.
export async function commitTree(remote, entries, message) {
  const { data: tree } = await octokit.rest.git.createTree({
    owner, repo, base_tree: remote.treeSha, tree: entries,
  })
  const { data: commit } = await octokit.rest.git.createCommit({
    owner, repo, message, tree: tree.sha, parents: [remote.commitSha],
  })
  await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${remote.branch}`, sha: commit.sha })
}

export async function createFile(path, content, message) {
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const name = path.split('/').pop()
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: message || `Create ${name}`,
    content: encoded,
  })
}
