// Floating screen switcher — prototype navigation helper only (skipped on Figma import).
(function () {
  var screens = [
    ["overview.html", "1", "Overview"],
    ["projects.html", "2", "Projects"],
    ["project-detail.html", "3", "Project detail"],
    ["parts-list.html", "4", "Parts list"],
    ["part-detail.html", "5", "Part detail"],
    ["issues-list.html", "6", "Issues"],
    ["issue-detail.html", "7", "Issue detail (atomic)"],
    ["magic-link-view.html", "M", "Magic link (supplier)"],
    ["revision-diff.html", "D", "Revision diff"],
    ["activity.html", "8", "Activity"],
    ["settings.html", "9", "Settings"],
    ["user-flow.html", "F", "User flow"],
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
