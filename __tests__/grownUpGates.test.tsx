/**
 * What a child must not reach alone: the price, the app's settings (one tap
 * silences every spoken instruction) and the paid parent dashboard. And what
 * they must reach: their own trophies.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {UpgradeScreen} from '../src/components/premium/UpgradeScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

const colors = {accent: '#fff', text: '#fff', primaryButton: '#000'} as any;

function render(visible: boolean) {
  let root!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(
      <UpgradeScreen
        visible={visible}
        colors={colors}
        onClose={() => {}}
        onPurchase={() => {}}
        onRestore={() => {}}
        product={{displayPrice: '4,99 €'} as any}
        purchasing={false}
        restoring={false}
        error={null}
        onClearError={() => {}}
      />,
    );
  });
  return root;
}

const texts = (root: ReactTestRenderer.ReactTestRenderer) =>
  JSON.stringify(root.toJSON());

describe('the price screen', () => {
  it('shows the parental gate first, not the price', () => {
    const root = render(true);
    const shown = texts(root);
    expect(shown).toContain('premium.parentalGate');
    expect(shown).not.toContain('4,99');
    expect(shown).not.toContain('premium.unlockAll');
  });

  it('shows the price once a grown-up has answered', () => {
    const root = render(true);
    const gate = root.root.findAllByType(require('../src/components/premium/ParentalGate').ParentalGate)[0];
    ReactTestRenderer.act(() => gate.props.onSuccess());
    const shown = texts(root);
    expect(shown).toContain('4,99');
  });

  it('only advertises what premium actually unlocks', () => {
    const root = render(true);
    const gate = root.root.findAllByType(require('../src/components/premium/ParentalGate').ParentalGate)[0];
    ReactTestRenderer.act(() => gate.props.onSuccess());
    const shown = texts(root);
    expect(shown).toContain('premium.featureAllWorlds');
    expect(shown).toContain('premium.featureUnlimitedModes');
    expect(shown).toContain('premium.featureParentDashboard');
    // Themes, stickers and achievements are free for everyone.
    expect(shown).not.toContain('premium.featureAllThemes');
    expect(shown).not.toContain('premium.featureStickerBook');
    expect(shown).not.toContain('premium.featureAchievements');
  });
});

describe('the parental gate itself', () => {
  it('always offers a way out, whatever the keyboard covers', () => {
    const {ParentalGate} = require('../src/components/premium/ParentalGate');
    const onCancel = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      root = ReactTestRenderer.create(
        <ParentalGate visible colors={colors} onSuccess={() => {}} onCancel={onCancel} />,
      );
    });
    // The corner close button carries the cancel label and is outside the
    // scrolling content, so a keyboard can never hide it.
    const closers = root.root
      .findAll(n => n.props?.accessibilityLabel === 'premium.parentalGateCancel');
    expect(closers.length).toBeGreaterThan(0);
    ReactTestRenderer.act(() => closers[0].props.onPress());
    expect(onCancel).toHaveBeenCalled();
  });
});
