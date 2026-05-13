/**
 * @NApiVersion 2.1
 * Shared logic for SimpleApp. Consumed by both the Suitelet (for HTML
 * rendering) and the RESTlet (for JSON / MCP-tool responses). This file
 * has no @NScriptType, so it's a plain library — any script type can
 * safely require it.
 */
define([], function () {
  function getGreeting(args) {
    var name = args && args.name ? String(args.name) : "stranger";
    return { greeting: "Hello, " + name };
  }

  function reverseText(args) {
    var text = args && typeof args.text === "string" ? args.text : "";
    return { reversed: text.split("").reverse().join("") };
  }

  function renderPage(args) {
    var name = args && args.name ? String(args.name) : "world";
    var result = getGreeting({ name: name });
    return [
      "<html>",
      "<body>",
      "  <h1>Cycle Collaboration</h1>",
      "  <p>" + result.greeting + "</p>",
      '  <button id="greet-btn" onclick="alert(\'Hi from SimpleApp!\')">Say hi</button>',
      "</body>",
      "</html>"
    ].join("\n");
  }

  return {
    getGreeting: getGreeting,
    reverseText: reverseText,
    renderPage: renderPage
  };
});
