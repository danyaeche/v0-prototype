// Floating screen switcher — prototype navigation helper only.
(function () {
  var screens = [
    ["overview.html", "1", "Overview"],
    ["parts.html", "2", "Parts"],
    ["part-detail.html", "3", "Part detail"],
    ["revision-diff.html", "4", "Revision diff"],
    ["suppliers.html", "5", "Suppliers"],
    ["activity.html", "6", "Activity"],
    ["settings.html", "7", "Settings"],
    ["supplier-portal.html", "8", "CM portal"],
    ["quote-submission.html", "9", "Quote"],
    ["login.html", "L", "Login"],
    ["signup.html", "S", "Sign up"],
  ];
  var here = location.pathname.split("/").pop() || "login.html";
  var el = document.createElement("div");
  el.className = "switcher";
  el.setAttribute("data-figma-skip", "true");
  el.innerHTML =
    '<span class="lbl">Screens</span>' +
    screens
      .map(function (s) {
        var active = s[0] === here ? ' style="background:rgba(255,255,255,.16);color:#fff"' : "";
        return '<a href="' + s[0] + '" title="' + s[2] + '"' + active + ">" + s[1] + "</a>";
      })
      .join("");
  document.body.appendChild(el);
})();
