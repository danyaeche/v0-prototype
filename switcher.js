// Floating screen switcher — prototype navigation helper only (skipped on Figma import).
(function () {
  var screens = [
    ["overview.html", "1", "Overview"],
    ["create-project.html", "+", "New project"],
    ["project-detail.html", "2", "Project detail"],
    ["part-detail.html", "3", "Part detail"],
    ["issues-list.html", "4", "Issues"],
    ["issue-detail.html", "5", "Issue detail (atomic)"],
    ["magic-link-view.html", "R", "Reviewer portal"],
    ["revision-diff.html", "D", "Revision diff"],
    ["activity.html", "6", "Activity"],
    ["settings.html", "7", "Settings"],
    ["user-flow.html", "F", "Workflow"],
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
