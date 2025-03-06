import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";
import { useSocket } from "../contexts/SocketContext";

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface IProps {
  currentActiveScene?: (scene_instance: Phaser.Scene) => void;
  selectedCharacter: number;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame({ currentActiveScene, selectedCharacter }, ref) {
    const game = useRef<Phaser.Game | null>(null!);
    const { updatePlayerPosition, players } = useSocket();

    useLayoutEffect(() => {
      if (game.current === null) {
        game.current = StartGame("game-container");

        if (typeof ref === "function") {
          ref({ game: game.current, scene: null });
        } else if (ref) {
          ref.current = { game: game.current, scene: null };
        }
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          if (game.current !== null) {
            game.current = null;
          }
        }
      };
    }, [ref]);

    useEffect(() => {
      EventBus.on("current-scene-ready", (scene_instance: Phaser.Scene) => {
        if (currentActiveScene && typeof currentActiveScene === "function") {
          currentActiveScene(scene_instance);
        }

        if (typeof ref === "function") {
          ref({ game: game.current, scene: scene_instance });
        } else if (ref) {
          ref.current = {
            game: game.current,
            scene: scene_instance,
          };
        }
      });
      return () => {
        EventBus.removeListener("current-scene-ready");
      };
    }, [currentActiveScene, ref]);

    useEffect(() => {
      if (game.current) {
        game.current.registry.set("selectedCharacter", selectedCharacter); // Store selected character
      }
    }, [selectedCharacter]);

    useEffect(() => {
      const handlePlayerMove = (position: { x: number; y: number }) => {
        updatePlayerPosition(position);
      };

      EventBus.on("player-move", handlePlayerMove);

      return () => {
        EventBus.off("player-move", handlePlayerMove);
      };
    }, [updatePlayerPosition]);

    useEffect(() => {
      if (game.current) {
        game.current.registry.set("players", players);
      }
    }, [players]);

    return <div id="game-container"></div>;
  },
);
