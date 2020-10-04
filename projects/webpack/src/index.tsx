import React, { useState, useCallback } from "react";
import { render } from "react-dom";

const Main = () => {
  const [clicked, setClicked] = useState(false);
  const handleClick = useCallback(() => setClicked(true), [setClicked]);
  return (
    <main>
      <button onClick={handleClick}>click me</button>
      {clicked && (
        <div>
          <p>clicked!</p>
        </div>
      )}
    </main>
  );
}

const elm = document.getElementById("app")!;

render(<Main />, elm);
