import { describe, expect, it } from 'vitest'
import { demoDocuments, demoFolders } from '~/data/demo'
import {
  orderedFolderEntries,
  buildBreadcrumbs,
  buildFolderTree,
  documentPublicPath,
  findFolderPath,
  folderPublicPath,
  resolveKnowledgePath,
  wouldCreateCycle,
} from '~/utils/folders'

describe('folder hierarchy and routes', () => {
  it('interleaves a guide, chapters, and supplemental reading without changing paths', () => {
    const chapter = { ...demoFolders[0]!, sort_order: 10 }
    const guide = { ...demoDocuments[0]!, id: 'guide', sort_order: 0 }
    const references = { ...guide, id: 'references', sort_order: 900 }
    const entries = orderedFolderEntries([chapter], [references, guide])
    expect(entries.map((entry) => entry.item.id)).toEqual([
      'guide',
      chapter.id,
      'references',
    ])
    expect(documentPublicPath(guide, demoFolders)).toBe(
      documentPublicPath(demoDocuments[0]!, demoFolders),
    )
    expect([references, guide].map((item) => item.id)).toEqual(['references', 'guide'])
  })

  it('shows a document before a folder with the same numeric order', () => {
    const entries = orderedFolderEntries(
      [{ ...demoFolders[0]!, sort_order: 0 }],
      [{ ...demoDocuments[0]!, sort_order: 0 }],
    )
    expect(entries.map((entry) => entry.kind)).toEqual(['document', 'folder'])
  })

  it('builds a sorted nested tree with descendant document counts', () => {
    const tree = buildFolderTree(demoFolders, demoDocuments)
    expect(tree.map((node) => node.name)).toEqual(['Java 后端', 'Agent 开发', 'RAG'])
    expect(
      tree[0]!.children.find((node) => node.name === 'Spring')?.children[0]?.name,
    ).toBe('Spring Boot')
    expect(tree[0]!.documentCount).toBe(1)
  })

  it('builds folder and document public paths', () => {
    expect(folderPublicPath('f-spring-boot', demoFolders)).toBe(
      '/knowledge/java-backend/spring/spring-boot',
    )
    expect(documentPublicPath(demoDocuments[0]!, demoFolders)).toBe(
      '/knowledge/java-backend/spring/spring-boot/spring-boot-introduction',
    )
  })

  it('resolves paths dynamically without hard-coded routes', () => {
    const result = resolveKnowledgePath(
      ['java-backend', 'spring', 'spring-boot', 'spring-boot-introduction'],
      demoFolders,
      demoDocuments,
    )
    expect(result.folder?.id).toBe('f-spring-boot')
    expect(result.document?.id).toBe('d-spring-boot')
  })

  it('detects self and descendant parent cycles', () => {
    expect(wouldCreateCycle('f-java', 'f-spring-boot', demoFolders)).toBe(true)
    expect(wouldCreateCycle('f-java', 'f-java', demoFolders)).toBe(true)
    expect(wouldCreateCycle('f-spring-boot', 'f-agent', demoFolders)).toBe(false)
  })

  it('creates complete breadcrumbs', () => {
    const doc = demoDocuments[0]!
    const folder = demoFolders.find((item) => item.id === doc.folder_id)!
    expect(findFolderPath(folder.id, demoFolders).map((item) => item.name)).toEqual([
      'Java 后端',
      'Spring',
      'Spring Boot',
    ])
    expect(
      buildBreadcrumbs(doc, folder, demoFolders).map((item) => item.label),
    ).toEqual(['知识库', 'Java 后端', 'Spring', 'Spring Boot', 'Spring Boot 简介'])
  })
})
