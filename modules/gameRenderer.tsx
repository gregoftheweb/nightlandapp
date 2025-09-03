// modules/gameRenderer.tsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { gameConfig } from '../config/gameConfig';
import { Position, GameState } from '../config/types';

const { width, height } = Dimensions.get('window');

export class GameRenderer {
  public readonly VIEWPORT_SIZE = gameConfig.ui.viewportSize;
  public readonly CELL_SIZE = Math.min(width, height) / this.VIEWPORT_SIZE;

  calculateCameraOffset(playerPos: Position, gameState: GameState) {
    const halfViewport = Math.floor(this.VIEWPORT_SIZE / 2);
    return {
      offsetX: Math.max(0, Math.min(
        gameState.gridWidth - this.VIEWPORT_SIZE, 
        playerPos.col - halfViewport
      )),
      offsetY: Math.max(0, Math.min(
        gameState.gridHeight - this.VIEWPORT_SIZE, 
        playerPos.row - halfViewport
      ))
    };
  }

  renderGameGrid(gameState: any) {
    const cameraOffset = this.calculateCameraOffset(gameState.player.position, gameState);
    const tiles = [];

    for (let row = 0; row < this.VIEWPORT_SIZE; row++) {
      for (let col = 0; col < this.VIEWPORT_SIZE; col++) {
        const worldRow = row + cameraOffset.offsetY;
        const worldCol = col + cameraOffset.offsetX;
        
        const isPlayer = worldRow === gameState.player.position.row && 
                        worldCol === gameState.player.position.col;

        const monsterAtPosition = gameState.activeMonsters?.find((monster: any) => 
          monster.position.row === worldRow && monster.position.col === worldCol
        );

        const itemAtPosition = gameState.items?.find((item: any) => 
          item.active && item.position.row === worldRow && item.position.col === worldCol
        );

        tiles.push(
          <View
            key={`${worldRow}-${worldCol}`}
            style={[
              styles.cell,
              {
                left: col * this.CELL_SIZE,
                top: row * this.CELL_SIZE,
                backgroundColor: this.getCellBackgroundColor(
                  worldRow, 
                  worldCol, 
                  isPlayer, 
                  monsterAtPosition, 
                  gameState
                ),
              },
            ]}
          >
            {/* Render terrain/background elements first */}
            {this.renderTerrain(worldRow, worldCol, gameState)}
            
            {/* Render items */}
            {itemAtPosition && (
              <Image
                source={this.getItemImage(itemAtPosition.shortName)}
                style={styles.item}
                resizeMode="contain"
              />
            )}
            
            {/* Render monsters */}
            {monsterAtPosition && !isPlayer && (
              <Image
                source={this.getMonsterImage(monsterAtPosition.shortName)}
                style={[
                  styles.character,
                  gameState.inCombat && { borderWidth: 2, borderColor: '#f00' }
                ]}
                resizeMode="contain"
              />
            )}
            
            {/* Render player last (on top) */}
            {isPlayer && (
              <Image
                source={require('../assets/images/christos.png')}
                style={[
                  styles.character,
                  gameState.player.isHidden && { opacity: 0.5 },
                  gameState.inCombat && { borderWidth: 2, borderColor: '#0f0' }
                ]}
                resizeMode="contain"
              />
            )}
          </View>
        );
      }
    }

    return (
      <View style={[styles.gridContainer, {
        width: this.VIEWPORT_SIZE * this.CELL_SIZE,
        height: this.VIEWPORT_SIZE * this.CELL_SIZE,
      }]}>
        {tiles}
      </View>
    );
  }

  renderUI(gameState: any) {
    return (
      <>
        {gameState.inCombat && this.renderCombatUI(gameState)}
        {this.renderPlayerStats(gameState)}
      </>
    );
  }

  private renderTerrain(row: number, col: number, gameState: any) {
    // Check for special terrain at this position
    const objectAtPosition = gameState.objects?.find((obj: any) => 
      obj.active && this.isPositionInObject(row, col, obj)
    );

    if (objectAtPosition) {
      return (
        <Image
          source={this.getObjectImage(objectAtPosition.shortName)}
          style={styles.terrain}
          resizeMode="cover"
        />
      );
    }

    return null;
  }

  private renderCombatUI(gameState: any) {
    return (
      <View style={styles.combatOverlay}>
        <View style={styles.combatInfo}>
          {/* Combat turn indicator */}
          {gameState.combatTurn && (
            <View style={styles.turnIndicator}>
              <Image
                source={gameState.combatTurn.name === 'Christos' 
                  ? require('../assets/images/christos.png')
                  : this.getMonsterImage(gameState.combatTurn.shortName)
                }
                style={styles.turnIcon}
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  private renderPlayerStats(gameState: any) {
    return (
      <View style={styles.statsOverlay}>
        <View style={styles.healthBar}>
          <View 
            style={[
              styles.healthFill, 
              { width: `${(gameState.player.hp / gameState.player.maxHP) * 100}%` }
            ]} 
          />
        </View>
      </View>
    );
  }

  private getCellBackgroundColor(
    row: number, 
    col: number, 
    isPlayer: boolean, 
    hasMonster: any,
    gameState: any
  ) {
    if (isPlayer && gameState.inCombat) return '#484';
    if (isPlayer) return '#444';
    if (hasMonster && gameState.inCombat) return '#844';
    if (hasMonster) return '#622';
    if (gameState.inCombat) return '#331';
    return '#111';
  }

  private isPositionInObject(row: number, col: number, obj: any): boolean {
    if (obj.collisionMask) {
      return obj.collisionMask.some((mask: any) => {
        const objRowStart = obj.position.row + mask.row;
        const objColStart = obj.position.col + mask.col;
        const objRowEnd = objRowStart + (mask.height || 1) - 1;
        const objColEnd = objColStart + (mask.width || 1) - 1;

        return row >= objRowStart && row <= objRowEnd && 
               col >= objColStart && col <= objColEnd;
      });
    } else {
      const objRowStart = obj.position.row;
      const objColStart = obj.position.col;
      const objWidth = obj.size?.width || 1;
      const objHeight = obj.size?.height || 1;
      const objRowEnd = objRowStart + objHeight - 1;
      const objColEnd = objColStart + objWidth - 1;

      return row >= objRowStart && row <= objRowEnd && 
             col >= objColStart && col <= objColEnd;
    }
  }

  private getMonsterImage(shortName: string) {
    const monsterImages: { [key: string]: any } = {
      'orc': require('../assets/images/orc.png'),
      'goblin': require('../assets/images/goblin.png'),
      'watcher': require('../assets/images/watcher.png'),
    };
    return monsterImages[shortName] || require('../assets/images/default_monster.png');
  }

  private getItemImage(shortName: string) {
    const itemImages: { [key: string]: any } = {
      'sword': require('../assets/images/sword.png'),
      'potion': require('../assets/images/potion.png'),
    };
    return itemImages[shortName] || require('../assets/images/default_item.png');
  }

  private getObjectImage(shortName: string) {
    const objectImages: { [key: string]: any } = {
      'tree': require('../assets/images/tree.png'),
      'rock': require('../assets/images/rock.png'),
    };
    return objectImages[shortName] || require('../assets/images/default_object.png');
  }
}

const styles = StyleSheet.create({
  gridContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#444',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: '#222',
  },
  character: {
    width: '80%',
    height: '80%',
    position: 'absolute',
    left: '10%',
    top: '10%',
  },
  item: {
    width: '60%',
    height: '60%',
    position: 'absolute',
    left: '20%',
    top: '20%',
  },
  terrain: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  combatOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  combatInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  turnIndicator: {
    alignItems: 'center',
  },
  turnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  healthBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#f44',
  },
});