'use client'

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
}

export function HighlightedText({ text, query, className = '' }: HighlightedTextProps) {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>
  }

  const searchTerm = query.trim()
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchTerm.toLowerCase()
        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-semibold rounded px-0.5 dark:bg-yellow-500/40 dark:text-white"
          >
            {part}
          </mark>
        ) : (
          part
        )
      })}
    </span>
  )
}
