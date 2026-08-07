import { useEffect, useState } from "react";

const Typewriter = ({
  text,
  speed = 65, 
  delay = 500,
}) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    let interval;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(text.slice(0, index + 1));

        index++;

        if (index >= text.length) {
          clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <>
      {displayText}
      <span className="typing-cursor">|</span>
    </>
  );
};

export default Typewriter;