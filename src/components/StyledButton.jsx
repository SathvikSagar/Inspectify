import React from "react";
import styled from "styled-components";

const StyledButton = ({ children, onClick }) => {
  return (
    <StyledWrapper>
      <button className="button" onClick={onClick}>
        {children}
        <div className="hoverEffect">
          <div />
        </div>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 15px 30px;
    border: 0;
    position: relative;
    overflow: hidden;
    border-radius: 10rem;
    transition: all 0.02s;
    font-weight: bold;
    cursor: pointer;
    color: rgb(6, 5, 5);
    z-index: 0;
    box-shadow: 0 0px 7px -5px rgba(0, 0, 0, 0.5);
  }

  .button:hover {
    background: rgb(193, 228, 248);
    color: rgb(33, 0, 85);
  }

  .button:active {
    transform: scale(0.97);
  }

  .hoverEffect {
    position: absolute;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .hoverEffect div {
    background: rgb(222, 0, 75);
    background: linear-gradient(
      90deg,
      rgba(222, 0, 75, 1) 0%,
      rgba(191, 70, 255, 1) 49%,
      rgba(0, 212, 255, 1) 100%
    );
    border-radius: 40rem;
    width: 10rem;
    height: 10rem;
    transition: 0.4s;
    filter: blur(20px);
    animation: effect infinite 3s linear;
    opacity: 0.5;
  }

  .button:hover .hoverEffect div {
    width: 8rem;
    height: 8rem;
  }

  @keyframes effect {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

export default StyledButton;
