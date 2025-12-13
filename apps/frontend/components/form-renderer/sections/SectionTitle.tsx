'use client'

interface SectionTitleProps {
  title: string
}

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="border-b pb-2">
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  )
}
