// Floating screen switcher — prototype navigation helper only.
(function () {
  var screens = [
    ["overview.html", "1", "Overview"],
    ["parts.html", "2", "Parts"],
    ["part-detail.html", "3", "Part detail"],
    ["revision-diff.html", "4", "Revision diff"],
    ["manufacturers.html", "5", "Manufacturers"],
    ["suppliers.html", "6", "Suppliers"],
    ["activity.html", "7", "Activity"],
    ["settings.html", "8", "Settings"],
    ["supplier-portal.html", "9", "Manufacturer portal"],
    ["quote-submission.html", "10", "Quote"],
    ["approval-workflow.html", "11", "Approvals"],
    ["dfm-review.html", "12", "DFM review"],
    ["comment-thread.html", "13", "Comments"],
    ["quote-review.html", "14", "Quote review"],
    ["rfq.html", "15", "RFQ"],
    ["production-release.html", "16", "Release"],
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
