import { useMemo } from "react";
import Particles from "@tsparticles/react";

function TechParticles({ theme }) {
  const options = useMemo(
    () => ({
      fullScreen: {
        enable: false,
      },

      fpsLimit: 60,

      pauseOnBlur: true,

      detectRetina: true,

      particles: {
        number: {
          value: 72,
          density: {
            enable: true,
          },
        },

        color: {
          value:
            theme === "dark"
              ? ["#60a5fa", "#22d3ee", "#8b5cf6"]
              : ["#2563eb", "#06b6d4", "#7c3aed"],
        },

        shape: {
          type: "circle",
        },

        opacity: {
          value: {
            min: 0.2,
            max: 0.68,
          },
          animation: {
            enable: true,
            speed: 0.65,
            sync: false,
          },
        },

        size: {
          value: {
            min: 1.2,
            max: 3.8,
          },
          animation: {
            enable: true,
            speed: 1.4,
            sync: false,
          },
        },

        links: {
          enable: true,
          distance: 158,
          color: theme === "dark" ? "#60a5fa" : "#2563eb",
          opacity: theme === "dark" ? 0.3 : 0.24,
          width: 1.15,
        },

        move: {
          enable: true,
          speed: 0.82,
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "out",
          },
        },
      },

      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
        },

        modes: {
          grab: {
            distance: 175,
            links: {
              opacity: 0.62,
            },
          },
        },
      },

      responsive: [
        {
          maxWidth: 720,
          options: {
            particles: {
              number: {
                value: 44,
              },
              move: {
                speed: 0.62,
              },
            },
          },
        },
      ],
    }),
    [theme],
  );

  return (
    <div className="hero-particles">
      <Particles
        id="techstore-particles"
        options={options}
      />
    </div>
  );
}

export default TechParticles;
