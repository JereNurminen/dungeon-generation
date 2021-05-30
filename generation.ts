export enum Direction {
  Up,
  Right,
  Down,
  Left,
}

export type Point = { x: number; y: number }

export enum RoomType {
  Entrance,
  Exit,
}

export enum TileType {
  Wall = 'wall',
  Floor = 'floor',
  Door = 'door',
  LadderUp = 'ladderUp',
  LadderDown = 'ladderDown',
}

export type Tile = { point: Point; type: TileType }

export interface Room {
  entrance: Point
  width: number
  height: number
  tiles: Tile[][]
  type: RoomType
  lastDir?: Direction
  nextDir?: Direction
}

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const checkIfTileExists = (tiles: Tile[]) => ({ x, y }: Point) =>
  tiles.some((tile) => tile.point.x === x && tile.point.y === y)

const randomDirection = (notAllowed?: Direction): Direction => {
  const i = randomInt(0, 3)
  if (notAllowed !== undefined && i === notAllowed.valueOf()) {
    return randomDirection(notAllowed)
  }
  switch (i) {
    case 0:
      return Direction.Up
    case 1:
      return Direction.Right
    case 2:
      return Direction.Down
    case 3:
      return Direction.Left
    default:
      // should never happen
      return Direction.Up
  }
}

const generateRooms = (
  startPoint: Point = { x: 0, y: 0 },
  maxRooms: number,
  rooms: Room[],
  lastDirection?: Direction,
  retries: number = 25
): Room[] => {
  if (rooms.length === maxRooms || retries < 0) {
    const lastRoom = rooms[rooms.length - 1]
    const firstRoom = rooms[0]
    const entrancePoint = {
      x: Math.ceil(firstRoom.width / 2) + 1,
      y: Math.ceil(firstRoom.height / 2) + 1,
    }
    const exitPoint = {
      x: Math.ceil(lastRoom.width / 2) + 1,
      y: Math.ceil(lastRoom.height / 2) + 1,
    }
    return [
      {
        ...firstRoom,
        tiles: firstRoom.tiles.map((row, y) =>
          row.map((tile, x) => {
            if (x === entrancePoint.x && y == entrancePoint.y) {
              return { ...tile, type: TileType.LadderUp }
            } else {
              return tile
            }
          })
        ),
      },
      ...rooms.slice(1, -1),
      {
        ...lastRoom,
        tiles: lastRoom.tiles.map((row, y) =>
          row.map((tile, x) => {
            if (x === exitPoint.x && y == exitPoint.y) {
              return { ...tile, type: TileType.LadderDown }
            } else if (tile.type === TileType.Door) {
              return { ...tile, type: TileType.Wall }
            } else {
              return tile
            }
          })
        ),
      },
    ]
  }

  const [width, height] = [randomInt(3, 6), randomInt(2, 5)]

  const vertDir = lastDirection === Direction.Up ? -1 : 1
  const horDir = lastDirection === Direction.Right ? -1 : 1

  const tiles: Tile[][] = Array(height)
    .fill(0)
    .map((_x, i) =>
      Array(width)
        .fill(0)
        .map((_y, j) => ({
          point: {
            x: startPoint.x + j * horDir,
            y: startPoint.y + i * vertDir,
          },
          type: TileType.Floor,
        }))
    )

  const nextDirection = randomDirection(lastDirection)
  const doorPos =
    nextDirection === Direction.Up || nextDirection === Direction.Down
      ? randomInt(1, width - 2)
      : randomInt(1, height - 2)

  const tilesWithWalls: Tile[][] = [
    Array(width + 2)
      .fill(0)
      .map((_x, i) => ({
        point: {
          x: startPoint.x + (horDir * i + horDir * -1),
          y: startPoint.y - vertDir * 1,
        },
        type:
          nextDirection === Direction.Down && doorPos === i
            ? TileType.Door
            : TileType.Wall,
      })),
    ...tiles.map((row, j) => [
      {
        point: {
          x: row[0].point.x + horDir * -1,
          y: startPoint.y + j * vertDir,
        },
        type:
          ((horDir === -1 && nextDirection === Direction.Right) ||
            (horDir === 1 && nextDirection === Direction.Left)) &&
          doorPos === j
            ? TileType.Door
            : TileType.Wall,
      },
      ...row,
      {
        point: {
          x: row[row.length - 1].point.x - horDir * -1,
          y: startPoint.y + j * vertDir,
        },
        type:
          ((horDir === 1 && nextDirection === Direction.Right) ||
            (horDir === -1 && nextDirection === Direction.Left)) &&
          doorPos === j
            ? TileType.Door
            : TileType.Wall,
      },
    ]),
    Array(width + 2)
      .fill(0)
      .map((_x, i) => ({
        point: {
          x: startPoint.x + (horDir * i + horDir * -1),
          y: startPoint.y + vertDir * height,
        },
        type:
          (lastDirection === Direction.Up &&
            nextDirection === Direction.Down &&
            doorPos === i) ||
          (nextDirection === Direction.Up && doorPos === i)
            ? TileType.Door
            : TileType.Wall,
      })),
  ]

  const areTilesFree = !tiles
    .flat()
    .some((tile) =>
      checkIfTileExists(rooms.flatMap((room) => room.tiles.flat()))(tile.point)
    )

  if (!areTilesFree) {
    return generateRooms(
      startPoint,
      maxRooms,
      rooms,
      lastDirection,
      retries - 1
    )
  }

  const nextRoomStartPos = ((nextDir: Direction): Point => {
    switch (nextDir) {
      case Direction.Up:
        return {
          x: startPoint.x + doorPos * horDir - horDir,
          y: startPoint.y + height + 1,
        }
      case Direction.Right:
        return {
          x: startPoint.x + width + 1,
          y: startPoint.y + vertDir * doorPos,
        }
      case Direction.Down:
        return {
          x: startPoint.x + doorPos * horDir - horDir,
          y: vertDir === -1 ? startPoint.y - height - 1 : startPoint.y - 2,
        }
      case Direction.Left:
        return {
          x: horDir === -1 ? startPoint.x - width - 1 : startPoint.x - 2,
          y: startPoint.y + vertDir * doorPos,
        }
    }
  })(nextDirection)

  const nextLastDirection = ((nextDir: Direction): Direction => {
    switch (nextDir) {
      case Direction.Up:
        return Direction.Down
      case Direction.Right:
        return Direction.Left
      case Direction.Down:
        return Direction.Up
      case Direction.Left:
        return Direction.Right
    }
  })(nextDirection)

  const newRooms = [
    ...rooms,
    {
      entrance: startPoint,
      width,
      height,
      tiles: tilesWithWalls,
      type: RoomType.Entrance,
      lastDir: lastDirection,
      nextDir: nextDirection,
    },
  ]

  return generateRooms(nextRoomStartPos, maxRooms, newRooms, nextLastDirection)
}

const generateDungeon = () => {
  return generateRooms({ x: 0, y: 0 }, 8, [])
}

export default generateDungeon
