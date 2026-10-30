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
    .filter(i => !i.name.startsWith('.') && i.name !== 'Mobile notes')
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
}

export async function getFile(path) {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
  return { content, sha: data.sha }
}

export async function saveFile(path, content, sha) {
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const name = path.split('/').pop()
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `Update ${name}`,
    content: encoded,
    sha,
  })
}

export async function createFile(path, content) {
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const name = path.split('/').pop()
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `Create ${name}`,
    content: encoded,
  })
}
