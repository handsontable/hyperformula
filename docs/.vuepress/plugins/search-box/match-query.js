
import get from 'lodash/get'

export default (query, page, additionalStr = null) => {
  let domain = get(page, 'title', '')

  if (get(page, 'frontmatter.tags')) {
    domain += ` ${page.frontmatter.tags.join(' ')}`
  }

  if (additionalStr) {
    domain += ` ${additionalStr}`
  }

  return matchTest(query, domain)
}

const matchTest = (query, domain) => {
  const lowerCaseDomain = domain.toLowerCase()
  const words = query
    .toLowerCase()
    .split(/\s+/g)
    .map(str => str.trim())
    .filter(str => !!str)

  return words.every(word => lowerCaseDomain.indexOf(word) > -1)
}
