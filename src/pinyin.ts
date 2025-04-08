import py from 'pinyin'

export function pinyin(word: string) {
  const fullPY = py(word, {
    style: py.STYLE_NORMAL,
    heteronym: true,
    //@ts-expect-error bad types
    compact: true,
  })
    .map((items) => items.join(''))
    .join('')
  const firstPY = py(word, {
    style: py.STYLE_FIRST_LETTER,
    heteronym: true,
    //@ts-expect-error bad types
    compact: true,
  })
    .map((items) => items.join(''))
    .join('')

  return {
    pinyin: fullPY,
    py: firstPY,
  }
}