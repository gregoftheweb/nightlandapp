export interface SubGameLaunch {
  subGameName: string // maps to /sub-games/<subGameName>
  ctaLabel: string // label for InfoBox button
  requiresPlayerOnObject?: boolean // default true
}

export interface SubGameResult<TData = unknown> {
  completed: boolean
  data?: TData // Optional result data from sub-game
}
