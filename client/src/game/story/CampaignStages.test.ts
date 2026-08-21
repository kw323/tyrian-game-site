import { describe, expect, it } from 'vitest';
import { CampaignStages } from './CampaignStages';

describe('Campaign stage map', () => {
    it('includes Stage 101 as the dedicated final-stage chapter', () => {
        const stages = CampaignStages.getAllStages();
        const finalStage = CampaignStages.getStage(101);

        expect(stages).toHaveLength(101);
        expect(finalStage.stageNumber).toBe(101);
        expect(finalStage.chapter).toBe(11);
        expect(finalStage.isBossStage).toBe(true);
        expect(finalStage.title).toContain('Archon Supreme');
    });
});
