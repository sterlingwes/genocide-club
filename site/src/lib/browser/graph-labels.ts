export const startCounterLabels = () => {
  const killedLabel: HTMLElement | null =
    document.querySelector("#label-killed");
  const wcKilledLabel: HTMLElement | null = document.querySelector(
    "#label-killed-context-2"
  );
  const killedLabelContext: HTMLElement | null = document.querySelector(
    "#label-killed-context-value"
  );
  const killedLabelContextUnit: HTMLElement | null = document.querySelector(
    "#label-killed-context-unit"
  );

  if (killedLabel && wcKilledLabel) {
    const labelSteps = JSON.parse(killedLabel.dataset.labels ?? "");
    const wcLabelSteps = JSON.parse(wcKilledLabel.dataset.labels ?? "");
    const intervalTime = +(killedLabel.dataset.interval ?? 0);
    if (killedLabelContext) {
      const dayDuration = +(killedLabelContext.dataset.daydur ?? 0);
      const days = +(killedLabelContext.dataset.days ?? 0);
      let day = 1;
      setTimeout(() => {
        const dayInterval = setInterval(() => {
          if (day === 1 && killedLabelContextUnit) {
            killedLabelContextUnit.innerHTML = "days";
          }

          if (day >= days) {
            clearInterval(dayInterval);
          } else {
            day++;
            killedLabelContext.innerHTML = `${day}`;
          }
        }, dayDuration * 1000);
      }, dayDuration * 1000); // after first day, set interval
    }

    let step = 0;
    const countInterval = setInterval(() => {
      if (!labelSteps[step]) {
        clearInterval(countInterval);
        return;
      }
      const value = labelSteps[step];
      const spanContainer = killedLabel.lastElementChild;
      if (!spanContainer) {
        throw new Error("No label span container");
      }

      const firstSpan = spanContainer.firstElementChild as HTMLElement | null;
      const lastSpan = spanContainer.lastElementChild as HTMLElement | null;
      if (!firstSpan || !lastSpan) {
        throw new Error(
          "Unexpected label element composition (spans not found)"
        );
      }

      // reset
      firstSpan.style.opacity = "1";

      if (value > 9999) {
        const [firstDigit, secondDigit, ...rest] = value.toString().split("");
        firstSpan.innerHTML = `${firstDigit}${secondDigit}`;
        lastSpan.innerHTML = rest.join("");
      } else if (value > 999) {
        const [firstDigit, ...rest] = value.toString().split("");
        firstSpan.innerHTML = firstDigit;
        lastSpan.innerHTML = rest.join("");
      } else {
        firstSpan.style.opacity = "0";
        firstSpan.innerHTML = "";
        lastSpan.innerHTML = value;
      }

      // women & children row
      const wcValue = wcLabelSteps[step];
      wcKilledLabel.firstElementChild!.nextElementSibling!.innerHTML =
        new Intl.NumberFormat().format(wcValue);

      step++;
    }, intervalTime);
  }
};
