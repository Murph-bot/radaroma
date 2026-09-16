import { describe, expect, it } from "vitest"
import { parseDuckDuckGoLite } from "./searchFallback"

const FIXTURE = `
<table>
  <tr><td><a rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Ftafcoffee.gr%2F&rut=abc" class='result-link'>TAF Coffee — Specialty Roaster</a></td></tr>
  <tr><td class='result-snippet'>Pioneer <b>specialty</b> roaster in Athens &amp; Exarchia.</td></tr>
  <tr><td><a rel="nofollow" class="result-link" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fmaps.google.com%2Fplace%2Ftaf%3Fentry%3Dttu&rut=def">TAF on Google Maps</a></td></tr>
  <tr><td class="result-snippet">Map listing &amp; reviews.</td></tr>
</table>`

describe("parseDuckDuckGoLite", () => {
  it("extracts title, decoded url, and snippet per result", () => {
    const results = parseDuckDuckGoLite(FIXTURE)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      title: "TAF Coffee — Specialty Roaster",
      url: "https://tafcoffee.gr/",
      snippet: "Pioneer specialty roaster in Athens & Exarchia.",
    })
    expect(results[1].url).toBe("https://maps.google.com/place/taf?entry=ttu")
  })

  it("decodes HTML entities in titles and snippets", () => {
    const html = `
      <a class='result-link' href='//duckduckgo.com/l/?uddg=https%3A%2F%2Fx.gr'>A &amp; B &#39;C&#39;</a>
      <td class='result-snippet'>5 &gt; 3 &lt; 7&nbsp;ok</td>`
    const [r] = parseDuckDuckGoLite(html)
    expect(r.title).toBe("A & B 'C'")
    expect(r.snippet).toBe("5 > 3 < 7 ok")
  })

  it("skips non-result links and caps at 5", () => {
    const html = Array.from(
      { length: 8 },
      (_, i) =>
        `<a class='result-link' href='//duckduckgo.com/l/?uddg=https%3A%2F%2Fsite${i}.gr'>r${i}</a>` +
        `<td class='result-snippet'>s${i}</td>`,
    ).join("")
    const results = parseDuckDuckGoLite(html + `<a href="/settings">settings</a>`)
    expect(results).toHaveLength(5)
    expect(results[0].url).toBe("https://site0.gr")
  })

  it("returns [] on markup it does not recognize", () => {
    expect(parseDuckDuckGoLite("<html><body>no results here</body></html>")).toEqual([])
    expect(parseDuckDuckGoLite("")).toEqual([])
  })

  it("ignores javascript: and non-http redirect targets", () => {
    const html = `<a class='result-link' href='//duckduckgo.com/l/?uddg=${encodeURIComponent("javascript:alert(1)")}'>x</a><td class='result-snippet'>y</td>`
    expect(parseDuckDuckGoLite(html)).toEqual([])
  })
})
