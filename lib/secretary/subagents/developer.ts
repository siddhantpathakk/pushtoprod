// Developer persona subagent — system-prompt + tool-allowlist wrapper.
// Body to be filled in once Anthropic SDK is wired.
export const DEVELOPER_SUBAGENT = {
  name: "developer-secretary",
  description:
    "Prioritizes CI failures, password/token expiry, security alerts, AWS cost alerts, PR reviews.",
} as const;
