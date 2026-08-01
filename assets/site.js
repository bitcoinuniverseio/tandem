const journey = document.querySelector("[data-journey]");

if (journey) {
  const tabs = Array.from(journey.querySelectorAll('[role="tab"]'));
  const panel = journey.querySelector('[role="tabpanel"]');
  const fields = {
    keyA: journey.querySelector("[data-key-a]"),
    keyB: journey.querySelector("[data-key-b]"),
    sequence: journey.querySelector("[data-sequence]"),
    stateName: journey.querySelector("[data-state-name]"),
    operation: journey.querySelector("[data-operation]"),
    title: journey.querySelector("[data-title]"),
    description: journey.querySelector("[data-description]"),
    control: journey.querySelector("[data-control]"),
    result: journey.querySelector("[data-result]"),
    safety: journey.querySelector("[data-safety]"),
  };

  const stages = {
    create: {
      keyA: "KEY A",
      keyB: "KEY B",
      sequence: "STATE 0",
      stateName: "ACTIVE",
      operation: "CREATE",
      title: "Begin one object together.",
      description:
        "Two clean inputs bind the pair to one exact shared carrier. The object begins active, with both keys required for every cooperative move.",
      control: "Key A and Key B",
      result: "One active Tandem",
      safety: "Recovery kit completed first",
    },
    mark: {
      keyA: "KEY A",
      keyB: "KEY B",
      sequence: "STATE N+1",
      stateName: "ACTIVE",
      operation: "MARK",
      title: "Add a chapter without breaking the line.",
      description:
        "The pair commits a new chapter and moves the carrier forward. Control stays with the current keys while the object's sequence advances exactly once.",
      control: "Current pair preserved",
      result: "Chapter commitment added",
      safety: "Replacement recovery kit required",
    },
    rotate: {
      keyA: "KEY A2",
      keyB: "KEY B2",
      sequence: "STATE N+1",
      stateName: "ACTIVE",
      operation: "ROTATE",
      title: "Change control by mutual consent.",
      description:
        "The current pair authorizes the next pair. One or both keys can change, while the object remains the same continuous Tandem.",
      control: "Successor key pair",
      result: "Same object, new control",
      safety: "New recovery kit required",
    },
    close: {
      keyA: "KEY A",
      keyB: "KEY B",
      sequence: "STATE N+1",
      stateName: "CLOSED",
      operation: "CLOSE",
      title: "End the shared object together.",
      description:
        "Both participants authorize a cooperative close. The carrier ends, value is paid out equally, and the terminal state remains part of the object's history.",
      control: "Final authorization by both",
      result: "Terminal closed state",
      safety: "Exact equal payout rules",
    },
    recover: {
      keyA: "KEY A",
      keyB: "KEY B",
      sequence: "STATE N",
      stateName: "REFUNDED",
      operation: "REFUND",
      title: "Use the exit that was prepared first.",
      description:
        "If collaboration stops, a fully signed refund can become valid after its relative lock matures. Recovery works because the transaction was completed before the parent moved.",
      control: "Pre-signed payout path",
      result: "Terminal refunded state",
      safety: "Relative lock must mature",
    },
  };

  function activate(tab, moveFocus = false) {
    const stageName = tab.dataset.stage;
    const stage = stages[stageName];
    if (!stage || !panel) return;

    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }

    journey.dataset.activeStage = stageName;
    panel.setAttribute("aria-labelledby", tab.id);

    for (const [name, element] of Object.entries(fields)) {
      if (element && stage[name]) element.textContent = stage[name];
    }

    if (moveFocus) tab.focus();
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(tab);
      let next = current;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === current) return;

      event.preventDefault();
      activate(tabs[next], true);
    });
  }

  activate(tabs[0]);
}
