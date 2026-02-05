# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Build Error" [level=1] [ref=e7]
        - paragraph [ref=e8]: Failed to compile
        - generic [ref=e9]:
          - text: Next.js (14.2.33) is outdated
          - link "(learn more)" [ref=e11] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
      - generic [ref=e12]:
        - generic [ref=e13]:
          - link "app/(dashboard)/project/[slug]/route/stop/[stopId]/perform/page.tsx" [ref=e14] [cursor=pointer]:
            - text: app/(dashboard)/project/[slug]/route/stop/[stopId]/perform/page.tsx
            - img
          - generic [ref=e19]:
            - text: "You cannot have two parallel pages that resolve to the same path. Please check /(dashboard)/project/[slug]/route/stop/[stopId]/perform/page and /(field-ops)/project/[slug]/route/stop/[stopId]/perform/page. Refer to the route group docs for more information:"
            - link "https://nextjs.org/docs/app/building-your-application/routing/route-groups" [ref=e20] [cursor=pointer]:
              - /url: https://nextjs.org/docs/app/building-your-application/routing/route-groups
        - contentinfo [ref=e21]:
          - paragraph [ref=e22]: This error occurred during the build process and can only be dismissed by fixing the error.
```