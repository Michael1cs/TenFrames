import React from 'react';
import {Image} from 'react-native';
import {Text} from '../common/AppText';
import {WorldId} from '../../types/game';
import {Emoji} from '../common/Emoji';

// One illustration per world, in the same glossy clay family as the mode
// icons. Each one shows the world's MATH — the cream ten-frame tray with the
// counters arranged the way that world's problems arrange them (two colors
// joining for addition, three slots left glowing for "make 10", two frames
// to compare for the monsters) — so a child who can't read the name still
// knows what they'll do inside. Keyed by WorldId, so a new world can't be
// added without its picture.
const WORLD_IMAGES: Record<WorldId, any> = {
  'counting-meadow': require('../../../assets/icons/world_counting_meadow.png'),
  'high-five': require('../../../assets/icons/world_high_five.png'),
  'monster-more': require('../../../assets/icons/world_hungry_monsters.png'),
  'addition-island': require('../../../assets/icons/world_addition_island.png'),
  'subtraction-mountain': require('../../../assets/icons/world_subtraction_mountain.png'),
  'make-ten-beach': require('../../../assets/icons/world_make_ten.png'),
  'mixed-targets': require('../../../assets/icons/world_number_bubbles.png'),
  'doubles-castle': require('../../../assets/icons/world_doubles_castle.png'),
  'number-town': require('../../../assets/icons/world_number_town.png'),
  'memory-garden': require('../../../assets/icons/world_memory_garden.png'),
  'farm-share': require('../../../assets/icons/world_farm_share.png'),
};

interface WorldIconProps {
  worldId: WorldId;
  width: number;
  height?: number; // the art is wider than tall; defaults to a square box
  fallbackEmoji: string; // the world's emoji, only if its image is missing
  dimmed?: boolean; // locked worlds show the picture faded behind a padlock
}

export function WorldIcon({
  worldId,
  width,
  height = width,
  fallbackEmoji,
  dimmed = false,
}: WorldIconProps) {
  const image = WORLD_IMAGES[worldId];
  if (!image) {
    return (
      <Text style={{fontSize: height * 0.7, opacity: dimmed ? 0.35 : 1}}>
        <Emoji>{fallbackEmoji}</Emoji>
      </Text>
    );
  }
  return (
    <Image
      source={image}
      style={{width, height, opacity: dimmed ? 0.35 : 1}}
      resizeMode="contain"
    />
  );
}
