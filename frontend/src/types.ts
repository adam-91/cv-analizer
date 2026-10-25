export interface AnalysisResult {
  score: number
  summary: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
  matched_keywords: string[]
  missing_keywords: string[]
}
