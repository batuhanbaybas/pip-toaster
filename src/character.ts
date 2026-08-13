export function createCharacter(): HTMLElement {
  const root = document.createElement("div");
  root.className = "character";
  root.dataset.state = "hidden";
  root.dataset.effort = "normal";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="character__shadow"></div>
    <div class="character__fx" aria-hidden="true">
      <span class="sweat sweat--1"></span>
      <span class="sweat sweat--2"></span>
      <span class="sweat sweat--3"></span>
      <span class="strain-mark strain-mark--1"></span>
      <span class="strain-mark strain-mark--2"></span>
    </div>
    <div class="character__figure">
      <div class="character__leg character__leg--left"></div>
      <div class="character__leg character__leg--right"></div>
      <div class="character__torso">
        <div class="character__arm character__arm--back"></div>
        <div class="character__body"></div>
        <div class="character__arm character__arm--front">
          <span class="character__hand"></span>
        </div>
        <div class="character__head">
          <div class="character__hat"></div>
          <div class="character__face">
            <span class="character__brow character__brow--l"></span>
            <span class="character__brow character__brow--r"></span>
            <span class="character__eye character__eye--l"></span>
            <span class="character__eye character__eye--r"></span>
            <span class="character__mouth"></span>
          </div>
        </div>
      </div>
    </div>
  `;
  return root;
}
