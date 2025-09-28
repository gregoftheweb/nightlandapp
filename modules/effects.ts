// modules/effects.ts - Item and object effects system
import { GameState, Item, Effect } from '../config/types';

// ==================== EFFECT EXECUTION INTERFACE ====================

export interface EffectExecutionContext {
  state: GameState;
  dispatch: (action: any) => void;
  showDialog?: (message: string, duration?: number) => void;
  item?: Item; // The item being used (if applicable)
}

export interface EffectResult {
  success: boolean;
  message: string;
  consumeItem: boolean; // Should the item be consumed/removed after use?
}

// ==================== HEAL EFFECT ====================

const executeHealEffect = (
  effect: Effect,
  context: EffectExecutionContext
): EffectResult => {
  const { state, dispatch, showDialog } = context;
  const healAmount = effect.value || 0;
  
  // Check if player needs healing
  if (state.player.hp >= state.player.maxHP) {
    return {
      success: false,
      message: effect.failureMessage || "You are already at full health!",
      consumeItem: false
    };
  }
  
  // Check resource costs if any
  if (effect.cost) {
    if (effect.cost.hp && state.player.hp < effect.cost.hp) {
      return {
        success: false,
        message: "Not enough HP to use this item!",
        consumeItem: false
      };
    }
    // Add other resource checks as needed
  }
  
  // Calculate actual heal amount (don't exceed max HP)
  const currentHp = state.player.hp;
  const maxHp = state.player.maxHP;
  const actualHealAmount = Math.min(healAmount, maxHp - currentHp);
  const newHp = currentHp + actualHealAmount;
  
  // Update player HP
  dispatch({
    type: 'UPDATE_PLAYER',
    payload: {
      updates: { hp: newHp }
    }
  });
  
  // Pay resource costs
  if (effect.cost?.hp) {
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        updates: { hp: newHp - effect.cost.hp }
      }
    });
  }
  
  // Show feedback
  const message = effect.successMessage || 
    `Restored ${actualHealAmount} HP! (${newHp}/${maxHp})`;
  showDialog?.(message, 3000);
  
  console.log(`Heal effect: ${currentHp} -> ${newHp} (+${actualHealAmount})`);
  
  return {
    success: true,
    message,
    consumeItem: true // Potions are consumed when used
  };
};

// ==================== MAIN EFFECT EXECUTOR ====================

export const executeEffect = (
  effect: Effect,
  context: EffectExecutionContext
): EffectResult => {
  console.log(`Executing effect: ${effect.type} with value: ${effect.value}`);
  
  switch (effect.type) {
    case 'heal':
      return executeHealEffect(effect, context);
      
    // Future effects can be added here:
    // case 'damage':
    //   return executeDamageEffect(effect, context);
    // case 'teleport':
    //   return executeTeleportEffect(effect, context);
    // case 'buff':
    //   return executeBuffEffect(effect, context);
    
    default:
      console.warn(`Unknown effect type: ${effect.type}`);
      return {
        success: false,
        message: `Unknown effect: ${effect.type}`,
        consumeItem: false
      };
  }
};

// ==================== ITEM USAGE HANDLER ====================

export const useItem = (
  item: Item,
  context: EffectExecutionContext
): EffectResult => {
  console.log(`Using item: ${item.name}`);
  
  // Check if item has effects
  if (!item.effects || item.effects.length === 0) {
    return {
      success: false,
      message: `${item.name} cannot be used.`,
      consumeItem: false
    };
  }
  
  // Execute all effects on the item
  let overallSuccess = true;
  let messages: string[] = [];
  let shouldConsume = false;
  
  for (const effect of item.effects) {
    const result = executeEffect(effect, { ...context, item });
    
    if (result.success) {
      messages.push(result.message);
      if (result.consumeItem) {
        shouldConsume = true;
      }
    } else {
      overallSuccess = false;
      messages.push(result.message);
    }
  }
  
  return {
    success: overallSuccess,
    message: messages.join(' '),
    consumeItem: shouldConsume
  };
};

// ==================== UTILITY FUNCTIONS ====================

export const canUseItem = (item: Item): boolean => {
  console.log("Checking if item can be used:", item.name);
  console.log("Item effects:", item.effects);
  console.log("Effects length:", item.effects?.length);
  
  const canUse = !!(item.effects && item.effects.length > 0);
  console.log("Can use result:", canUse);
  
  return canUse;
};

export const getItemEffectDescription = (item: Item): string => {
  if (!item.effects || item.effects.length === 0) {
    return "This item has no special effects.";
  }
  
  const descriptions: string[] = [];
  
  for (const effect of item.effects) {
    switch (effect.type) {
      case 'heal':
        descriptions.push(`Restores ${effect.value} HP`);
        break;
      default:
        descriptions.push(`${effect.type} effect`);
    }
  }
  
  return descriptions.join(', ');
};