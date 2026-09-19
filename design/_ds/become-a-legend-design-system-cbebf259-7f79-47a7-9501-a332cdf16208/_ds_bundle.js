/* @ds-bundle: {"format":4,"namespace":"BecomeALegendDesignSystem_cbebf2","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"ChallengeCard","sourcePath":"components/game/ChallengeCard.jsx"},{"name":"CoinChip","sourcePath":"components/game/CoinChip.jsx"},{"name":"GameTag","sourcePath":"components/game/GameTag.jsx"},{"name":"MatchResult","sourcePath":"components/game/MatchResult.jsx"},{"name":"PlayerRow","sourcePath":"components/game/PlayerRow.jsx"},{"name":"StatTile","sourcePath":"components/game/StatTile.jsx"},{"name":"TIERS","sourcePath":"components/game/TierBadge.jsx"},{"name":"TierBadge","sourcePath":"components/game/TierBadge.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"81b99239d083","components/core/Badge.jsx":"5f0486d708a4","components/core/Button.jsx":"f7590ccd9f1a","components/core/Card.jsx":"3a4c3bb5e93c","components/core/Icon.jsx":"5d755e80379a","components/core/IconButton.jsx":"c9b1c75163f8","components/core/Tag.jsx":"cb0388850d30","components/feedback/Dialog.jsx":"281b08f21ca1","components/feedback/Toast.jsx":"befd71a791e3","components/feedback/Tooltip.jsx":"b3d228075d24","components/forms/Checkbox.jsx":"472b0b1dfb34","components/forms/Input.jsx":"997d5f8ae085","components/forms/Radio.jsx":"479de419e9a1","components/forms/Select.jsx":"5b168af5a5e9","components/forms/Switch.jsx":"e8f0ef94a00b","components/game/ChallengeCard.jsx":"301163d10ca3","components/game/CoinChip.jsx":"a95505dfd9c7","components/game/GameTag.jsx":"e8b01cf25445","components/game/MatchResult.jsx":"1202852ac5ac","components/game/PlayerRow.jsx":"78e7f51e9371","components/game/StatTile.jsx":"ccd91a0dfe54","components/game/TierBadge.jsx":"7d0bb95949d6","components/game/XPBar.jsx":"49c0a0101265","components/navigation/BottomNav.jsx":"1671b378442e","components/navigation/Tabs.jsx":"a63af1d7a441","ui_kits/app/Onboarding.jsx":"e98d4b1ae46f","ui_kits/app/Screens.jsx":"359d84f615ce","ui_kits/app/Shell.jsx":"9be3098cce85","ui_kits/dashboard/Panels.jsx":"451da9fa7aab","ui_kits/dashboard/Sidebar.jsx":"9d5c788f7de6","ui_kits/website/Hero.jsx":"87447b28faa5","ui_kits/website/Nav.jsx":"6302d46114c9","ui_kits/website/Sections.jsx":"eb79382a4ac2"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BecomeALegendDesignSystem_cbebf2 = window.BecomeALegendDesignSystem_cbebf2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88
};
function Avatar({
  name = '',
  src,
  size = 'md',
  tier,
  online,
  style
}) {
  const box = SIZES[size] || SIZES.md;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const ring = tier ? '2px solid var(--tier-' + tier + ')' : '1px solid var(--border-subtle)';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: '0 0 auto',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: box,
      height: box,
      borderRadius: 'var(--radius-2)',
      overflow: 'hidden',
      background: 'var(--surface-3)',
      border: ring,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: Math.round(box * 0.38),
      color: 'var(--text-secondary)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials), online ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: Math.max(8, box * 0.22),
      height: Math.max(8, box * 0.22),
      borderRadius: 999,
      background: 'var(--green-500)',
      border: '2px solid var(--bg-canvas)'
    }
  }) : null);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
const PADS = {
  none: 0,
  sm: 'var(--space-5)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)'
};
function Card({
  children,
  surface = '2',
  padding = 'md',
  interactive,
  accentEdge,
  elevation = 0,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const shadow = elevation === 0 ? 'none' : 'var(--shadow-' + elevation + ')';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: hover && interactive ? 'var(--surface-3)' : 'var(--surface-' + surface + ')',
      border: '1px solid ' + (hover && interactive ? 'var(--border-subtle)' : 'var(--border-hairline)'),
      borderTop: accentEdge ? '2px solid var(--red-500)' : undefined,
      borderRadius: 'var(--radius-card)',
      padding: PADS[padding],
      boxShadow: shadow,
      cursor: interactive ? 'pointer' : undefined,
      transition: 'var(--transition-color)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/* Lucide (CDN) is the system's icon set. The host page loads
   https://unpkg.com/lucide@0.544.0/dist/umd/lucide.js once; this wrapper renders the
   placeholder element and asks Lucide to swap in the SVG. */
function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.75,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '<i data-lucide="' + name + '"></i>';
    const paint = () => {
      if (!window.lucide) return false;
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: {
          width: size,
          height: size,
          stroke: color,
          'stroke-width': strokeWidth
        },
        root: el
      });
      return true;
    };
    if (!paint()) {
      const t = setInterval(() => {
        if (paint()) clearInterval(t);
      }, 120);
      return () => clearInterval(t);
    }
  }, [name, size, color, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      width: size,
      height: size,
      flex: '0 0 auto',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: ['var(--surface-3)', 'var(--text-secondary)', 'var(--border-subtle)'],
  win: ['var(--green-tint)', 'var(--green-500)', 'var(--green-500)'],
  pending: ['var(--amber-tint)', 'var(--amber-500)', 'var(--amber-500)'],
  live: ['var(--red-tint)', 'var(--red-400)', 'var(--red-500)'],
  info: ['var(--blue-tint)', 'var(--blue-500)', 'var(--blue-500)'],
  loss: ['transparent', 'var(--state-loss)', 'var(--border-subtle)']
};
function Badge({
  children,
  tone = 'neutral',
  icon,
  dot,
  pill,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: t[0],
      color: t[1],
      border: '1px solid ' + t[2],
      borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-1)',
      padding: '3px 8px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      letterSpacing: 'var(--tracking-label)',
      lineHeight: 1.4,
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: t[1]
    }
  }) : null, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const SIZES = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 13,
    gap: 6,
    icon: 14
  },
  md: {
    height: 40,
    padding: '0 18px',
    fontSize: 14,
    gap: 8,
    icon: 16
  },
  lg: {
    height: 48,
    padding: '0 24px',
    fontSize: 16,
    gap: 10,
    icon: 18
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--action-primary-bg)',
    color: 'var(--action-primary-fg)',
    border: '1px solid var(--action-primary-bg)'
  },
  secondary: {
    background: 'var(--action-secondary-bg)',
    color: 'var(--action-secondary-fg)',
    border: '1px solid var(--border-subtle)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--action-ghost-fg)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)'
  },
  danger: {
    background: 'transparent',
    color: 'var(--red-400)',
    border: '1px solid var(--red-600)'
  }
};
const HOVER = {
  primary: {
    background: 'var(--action-primary-bg-hover)',
    borderColor: 'var(--action-primary-bg-hover)'
  },
  secondary: {
    background: 'var(--action-secondary-bg-hover)'
  },
  ghost: {
    background: 'var(--surface-3)',
    color: 'var(--text-primary)'
  },
  outline: {
    background: 'var(--surface-2)'
  },
  danger: {
    background: 'var(--red-tint)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  fullWidth,
  disabled,
  loading,
  type = 'button',
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const css = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    fontSize: s.fontSize,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    borderRadius: 'var(--radius-control)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    transition: 'var(--transition-color), opacity var(--dur-fast) var(--ease-standard)',
    opacity: disabled ? 0.38 : press ? 0.86 : 1,
    ...v,
    ...(hover && !disabled ? HOVER[variant] : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled || loading,
    onClick: onClick,
    style: css,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false)
  }, loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader-circle",
    size: s.icon
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconAfter ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconAfter,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
const SIZES = {
  sm: 28,
  md: 36,
  lg: 44
};
function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  disabled,
  active,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const box = SIZES[size] || SIZES.md;
  const bg = variant === 'solid' ? 'var(--action-secondary-bg)' : active ? 'var(--red-tint)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: box,
      height: box,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: hover && !disabled ? 'var(--surface-3)' : bg,
      color: active ? 'var(--red-400)' : 'var(--text-secondary)',
      border: variant === 'solid' ? '1px solid var(--border-subtle)' : '1px solid transparent',
      borderRadius: 'var(--radius-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.38 : 1,
      transition: 'var(--transition-color)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 15 : size === 'lg' ? 20 : 17
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  selected,
  removable,
  onRemove,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: selected ? 'var(--red-tint)' : hover && onClick ? 'var(--surface-3)' : 'transparent',
      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
      border: '1px solid ' + (selected ? 'var(--red-500)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-1)',
      padding: '5px 10px',
      fontSize: 13,
      fontWeight: 500,
      fontFamily: 'var(--font-body)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'var(--transition-color)',
      ...style
    }
  }, children, removable ? /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove && onRemove();
    },
    style: {
      display: 'inline-flex',
      cursor: 'pointer',
      opacity: 0.6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 12
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  width = 440
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--overlay-scrim)',
      backdropFilter: 'var(--blur-overlay)',
      animation: 'none'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-3)',
      boxShadow: 'var(--shadow-3)',
      padding: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)',
      margin: 0
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontSize: 14,
      color: 'var(--text-muted)',
      maxWidth: '44ch'
    }
  }, description) : null), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Cerrar",
    onClick: onClose
  }) : null), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-7)'
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  neutral: 'var(--text-muted)',
  win: 'var(--green-500)',
  pending: 'var(--amber-500)',
  error: 'var(--red-400)'
};
const ICONS = {
  neutral: 'info',
  win: 'circle-check',
  pending: 'clock',
  error: 'circle-alert'
};
function Toast({
  title,
  message,
  tone = 'neutral',
  onDismiss,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      width: 340,
      padding: 'var(--space-5)',
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-3)',
      boxShadow: 'var(--shadow-2)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: TONES[tone],
      display: 'inline-flex',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICONS[tone],
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title), message ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, message) : null), onDismiss ? /*#__PURE__*/React.createElement("span", {
    onClick: onDismiss,
    style: {
      cursor: 'pointer',
      color: 'var(--text-faint)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  children,
  side = 'top'
}) {
  const [show, setShow] = React.useState(false);
  const pos = side === 'top' ? {
    bottom: '100%',
    left: '50%',
    transform: 'translate(-50%,-8px)'
  } : side === 'bottom' ? {
    top: '100%',
    left: '50%',
    transform: 'translate(-50%,8px)'
  } : side === 'left' ? {
    right: '100%',
    top: '50%',
    transform: 'translate(-8px,-50%)'
  } : {
    left: '100%',
    top: '50%',
    transform: 'translate(8px,-50%)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 60,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      background: 'var(--ink-000)',
      color: 'var(--ink-950)',
      padding: '5px 9px',
      borderRadius: 'var(--radius-1)',
      fontSize: 12,
      fontWeight: 600,
      opacity: show ? 1 : 0,
      transition: 'var(--transition-opacity)',
      boxShadow: 'var(--shadow-2)'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: description ? 'flex-start' : 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--red-500)' : 'var(--surface-2)',
      border: '1px solid ' + (checked ? 'var(--red-500)' : 'var(--border-strong)'),
      borderRadius: 'var(--radius-1)',
      color: '#fff',
      transition: 'var(--transition-color)',
      marginTop: description ? 2 : 0
    }
  }, checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2.5
  }) : null), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  hint,
  error,
  disabled,
  suffix,
  id,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || 'in-' + React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 8
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 44,
      padding: '0 14px',
      background: 'var(--surface-2)',
      border: '1px solid ' + (error ? 'var(--red-500)' : focus ? 'var(--border-strong)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-control)',
      opacity: disabled ? 0.45 : 1,
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'var(--transition-color)'
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })) : null, /*#__PURE__*/React.createElement("input", {
    id: inputId,
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 0,
      outline: 'none',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      fontSize: 15
    }
  }), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, suffix) : null), hint || error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 6,
      fontSize: 12,
      color: error ? 'var(--red-400)' : 'var(--text-muted)'
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  description,
  checked,
  onChange,
  name,
  value,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: description ? 'flex-start' : 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: !!checked,
    disabled: disabled,
    onChange: () => onChange && onChange(value),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: '0 0 auto',
      borderRadius: 999,
      background: 'var(--surface-2)',
      border: '1px solid ' + (checked ? 'var(--red-500)' : 'var(--border-strong)'),
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'var(--transition-color)',
      marginTop: description ? 2 : 0
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 999,
      background: 'var(--red-500)'
    }
  }) : null), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  value,
  onChange,
  options = [],
  hint,
  disabled,
  id,
  style
}) {
  const selectId = id || 'sel-' + React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: selectId,
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 8
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("select", {
    id: selectId,
    value: value,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    style: {
      width: '100%',
      height: 44,
      padding: '0 38px 0 14px',
      appearance: 'none',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-control)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      opacity: disabled ? 0.45 : 1,
      cursor: 'pointer'
    }
  }, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      top: 13,
      color: 'var(--text-muted)',
      pointerEvents: 'none',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16
  }))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 6,
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description) : null), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 26,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--red-500)' : 'var(--surface-raised)',
      border: '1px solid ' + (checked ? 'var(--red-500)' : 'var(--border-strong)'),
      position: 'relative',
      transition: 'var(--transition-color)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 20 : 2,
      width: 20,
      height: 20,
      borderRadius: 999,
      background: '#fff',
      transition: 'left var(--dur-fast) var(--ease-standard)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/game/CoinChip.jsx
try { (() => {
function CoinChip({
  amount = 0,
  xp,
  level,
  onClick,
  style
}) {
  const fmt = n => n.toLocaleString('es-MX');
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0,
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-2)',
      background: 'var(--surface-2)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      height: 34,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 10px',
      height: '100%',
      color: 'var(--amber-500)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "coins",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, fmt(amount))), xp != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 10px',
      height: '100%',
      borderLeft: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow",
    style: {
      fontSize: 9
    }
  }, "XP"), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, fmt(xp)), level != null ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, 'Lv ' + level) : null) : null);
}
Object.assign(__ds_scope, { CoinChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/CoinChip.jsx", error: String((e && e.message) || e) }); }

// components/game/GameTag.jsx
try { (() => {
const GAMES = {
  lol: {
    label: 'League of Legends',
    short: 'LoL'
  },
  tft: {
    label: 'TFT',
    short: 'TFT'
  }
};
function GameTag({
  game = 'lol',
  short,
  queue,
  style
}) {
  const g = GAMES[game] || {
    label: game,
    short: game
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 9px',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-1)',
      background: 'var(--surface-3)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase'
    }
  }, short ? g.short : g.label), queue ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, queue) : null);
}
Object.assign(__ds_scope, { GameTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/GameTag.jsx", error: String((e && e.message) || e) }); }

// components/game/ChallengeCard.jsx
try { (() => {
const STATUS = {
  pendiente: {
    tone: 'pending',
    label: 'Pendiente'
  },
  vivo: {
    tone: 'live',
    label: 'En vivo'
  },
  ganado: {
    tone: 'win',
    label: 'Ganado'
  },
  perdido: {
    tone: 'loss',
    label: 'Perdido'
  }
};
function ChallengeCard({
  challenger,
  opponent,
  game = 'lol',
  queue,
  status = 'pendiente',
  stake,
  xp,
  meta,
  onAccept,
  onDecline,
  onClick,
  style
}) {
  const s = STATUS[status] || STATUS.pendiente;
  const live = status === 'vivo';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderTop: live ? '2px solid var(--red-500)' : '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.GameTag, {
    game: game,
    queue: queue,
    short: true
  }), meta ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, meta) : null), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: s.tone,
    dot: live,
    pill: live
  }, s.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '20px 18px'
    }
  }, /*#__PURE__*/React.createElement(Side, {
    player: challenger,
    align: "left"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '0 14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.1em',
      color: 'var(--text-faint)'
    }
  }, "VS"), stake != null ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--amber-500)'
    }
  }, stake.toLocaleString('es-MX') + ' monedas') : null, xp != null ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, '+' + xp + ' XP') : null), /*#__PURE__*/React.createElement(Side, {
    player: opponent,
    align: "right"
  })), onAccept || onDecline ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '0 18px 18px'
    }
  }, onAccept ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "md",
    fullWidth: true,
    onClick: onAccept
  }, "Aceptar reto") : null, onDecline ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "md",
    onClick: onDecline
  }, "Rechazar") : null) : null);
}
function Side({
  player,
  align
}) {
  if (!player) return /*#__PURE__*/React.createElement("div", null);
  const right = align === 'right';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexDirection: right ? 'row-reverse' : 'row',
      textAlign: right ? 'right' : 'left'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: player.name,
    src: player.src,
    tier: player.tier,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, player.name), /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, player.handle || player.record || '')));
}
Object.assign(__ds_scope, { ChallengeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ChallengeCard.jsx", error: String((e && e.message) || e) }); }

// components/game/MatchResult.jsx
try { (() => {
function MatchResult({
  winner,
  loser,
  score,
  game,
  verified = true,
  awarded,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-2)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 'var(--space-7)',
      background: 'var(--green-tint)',
      borderRight: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow",
    style: {
      color: 'var(--green-500)'
    }
  }, "Ganador"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: winner && winner.name,
    tier: winner && winner.tier,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)'
    }
  }, winner && winner.name), awarded ? /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--green-500)',
      marginTop: 3
    }
  }, awarded) : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 'var(--space-7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow"
  }, "Derrota"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
      opacity: 0.62
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: loser && loser.name,
    tier: loser && loser.tier,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)'
    }
  }, loser && loser.name))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderTop: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, score, game ? ' · ' + game : ''), verified ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "shield-check",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow"
  }, "Verificado autom\xE1ticamente")) : null));
}
Object.assign(__ds_scope, { MatchResult });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/MatchResult.jsx", error: String((e && e.message) || e) }); }

// components/game/StatTile.jsx
try { (() => {
function StatTile({
  label,
  value,
  delta,
  deltaTone = 'win',
  icon,
  style
}) {
  const tone = deltaTone === 'win' ? 'var(--green-500)' : deltaTone === 'loss' ? 'var(--red-400)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-3)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--text-muted)'
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow"
  }, label)), /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      marginTop: 12,
      fontSize: 32,
      fontWeight: 500,
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)',
      lineHeight: 1
    }
  }, value), delta ? /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      marginTop: 8,
      fontSize: 12,
      color: tone
    }
  }, delta) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/game/TierBadge.jsx
try { (() => {
const TIERS = [{
  slug: 'madera',
  label: 'Madera',
  mark: 'M',
  level: 1
}, {
  slug: 'hierro',
  label: 'Hierro',
  mark: 'H',
  level: 2
}, {
  slug: 'bronce',
  label: 'Bronce',
  mark: 'B',
  level: 3
}, {
  slug: 'plata',
  label: 'Plata',
  mark: 'P',
  level: 4
}, {
  slug: 'oro',
  label: 'Oro',
  mark: 'O',
  level: 5
}, {
  slug: 'esmeralda',
  label: 'Esmeralda',
  mark: 'E',
  level: 6
}, {
  slug: 'platino',
  label: 'Platino',
  mark: 'PT',
  level: 7
}, {
  slug: 'retador',
  label: 'Retador',
  mark: 'R',
  level: 8
}, {
  slug: 'maestro',
  label: 'Maestro',
  mark: 'MA',
  level: 9
}, {
  slug: 'gran-maestro',
  label: 'Gran Maestro',
  mark: 'GM',
  level: 10
}];
const SIZES = {
  sm: {
    box: 22,
    font: 10,
    label: 12
  },
  md: {
    box: 30,
    font: 13,
    label: 14
  },
  lg: {
    box: 44,
    font: 18,
    label: 18
  }
};
function TierBadge({
  tier = 'oro',
  size = 'md',
  showLabel = true,
  division,
  style
}) {
  const t = TIERS.find(x => x.slug === tier) || TIERS[4];
  const s = SIZES[size] || SIZES.md;
  const c = 'var(--tier-' + t.slug + ')';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      width: s.box,
      height: s.box,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--tier-' + t.slug + '-tint)',
      border: '1px solid ' + c,
      color: c,
      borderRadius: 'var(--radius-1)',
      fontSize: s.font,
      fontWeight: 700,
      letterSpacing: '0.02em'
    }
  }, t.mark), showLabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: s.label,
      fontWeight: 600,
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap'
    }
  }, t.label, division ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      color: 'var(--text-muted)',
      marginLeft: 5,
      fontWeight: 500
    }
  }, division) : null) : null);
}
Object.assign(__ds_scope, { TIERS, TierBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/TierBadge.jsx", error: String((e && e.message) || e) }); }

// components/game/PlayerRow.jsx
try { (() => {
function PlayerRow({
  name,
  handle,
  tier,
  rank,
  record,
  right,
  online,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 14px',
      background: hover && onClick ? 'var(--surface-3)' : 'transparent',
      borderBottom: '1px solid var(--divider)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'var(--transition-color)',
      ...style
    }
  }, rank != null ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      width: 24,
      fontSize: 13,
      color: 'var(--text-faint)',
      textAlign: 'right'
    }
  }, rank) : null, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    tier: tier,
    online: online
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, name), handle ? /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-faint)'
    }
  }, handle) : null), tier ? /*#__PURE__*/React.createElement(__ds_scope.TierBadge, {
    tier: tier,
    size: "sm",
    showLabel: false
  }) : null, record ? /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, record) : null, right);
}
Object.assign(__ds_scope, { PlayerRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/PlayerRow.jsx", error: String((e && e.message) || e) }); }

// components/game/XPBar.jsx
try { (() => {
function XPBar({
  value = 0,
  max = 100,
  tier,
  nextTier,
  compact,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fill = tier ? 'var(--tier-' + tier + ')' : 'var(--red-500)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, !compact ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow"
  }, "Progreso de temporada"), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, value.toLocaleString('es-MX') + ' / ' + max.toLocaleString('es-MX') + ' XP')) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: compact ? 4 : 8,
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-1)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      background: fill,
      transition: 'width var(--dur-base) var(--ease-standard)'
    }
  })), nextTier && !compact ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, 'Siguiente: ' + nextTier) : null);
}
Object.assign(__ds_scope, { XPBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/XPBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function BottomNav({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-hairline)',
      padding: '8px 4px 22px',
      ...style
    }
  }, items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      style: {
        flex: 1,
        minHeight: 48,
        background: 'none',
        border: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        color: on ? 'var(--text-primary)' : 'var(--text-faint)',
        transition: 'var(--transition-color)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 21,
      strokeWidth: on ? 2 : 1.75
    }), it.badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -3,
        right: -6,
        minWidth: 15,
        height: 15,
        padding: '0 4px',
        borderRadius: 999,
        background: 'var(--red-500)',
        color: '#fff',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, it.badge) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.02em'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-7)',
      borderBottom: '1px solid var(--divider)',
      ...style
    }
  }, items.map(it => {
    const v = typeof it === 'string' ? it : it.value;
    const l = typeof it === 'string' ? it : it.label;
    const count = typeof it === 'string' ? null : it.count;
    const on = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(v),
      style: {
        background: 'none',
        border: 0,
        padding: '0 0 12px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        color: on ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: '2px solid ' + (on ? 'var(--red-500)' : 'transparent'),
        marginBottom: -1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'var(--transition-color)'
      }
    }, l, count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: on ? 'var(--red-400)' : 'var(--text-faint)'
      }
    }, count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Onboarding.jsx
try { (() => {
const {
  Button,
  Input,
  Tag,
  Card,
  Icon
} = window.BecomeALegendDesignSystem_cbebf2;
function Onboarding({
  step,
  setStep,
  onDone
}) {
  const [games, setGames] = React.useState(['League of Legends']);
  const toggle = g => setGames(s => s.includes(g) ? s.filter(x => x !== g) : s.concat(g));
  if (step === 0) {
    return /*#__PURE__*/React.createElement(Pad, null, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 0.95,
        letterSpacing: '-0.04em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)'
      }
    }, "Become", /*#__PURE__*/React.createElement("br", null), "a Legend"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 20,
        fontSize: 16,
        lineHeight: 1.55,
        color: 'var(--text-muted)'
      }
    }, "Ret\xE1 a tus amigos en League of Legends y TFT. El resultado se verifica solo.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      icon: "gamepad-2",
      onClick: () => setStep(1)
    }, "Entrar con Riot"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      fullWidth: true,
      onClick: () => setStep(1)
    }, "Usar mi correo"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: 'var(--text-faint)',
        textAlign: 'center',
        marginTop: 4
      }
    }, "Al continuar acept\xE1s los t\xE9rminos y el juego responsable.")));
  }
  if (step === 1) {
    return /*#__PURE__*/React.createElement(Pad, null, /*#__PURE__*/React.createElement(Steps, {
      n: 1
    }), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.035em',
        color: 'var(--text-primary)'
      }
    }, "Cre\xE1 tu cuenta"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 24,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Correo",
      type: "email",
      placeholder: "tu@correo.com",
      icon: "mail",
      onChange: () => {}
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Contrase\xF1a",
      type: "password",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      icon: "lock",
      hint: "M\xEDnimo 8 caracteres.",
      onChange: () => {}
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Riot ID",
      placeholder: "TuNombre",
      icon: "user",
      suffix: "#LAN",
      onChange: () => {}
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      onClick: () => setStep(2)
    }, "Continuar"));
  }
  return /*#__PURE__*/React.createElement(Pad, null, /*#__PURE__*/React.createElement(Steps, {
    n: 2
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      color: 'var(--text-primary)'
    }
  }, "Eleg\xED tus juegos"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "Pod\xE9s cambiarlos despu\xE9s en tu perfil."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 24
    }
  }, ['League of Legends', 'TFT'].map(g => /*#__PURE__*/React.createElement(Tag, {
    key: g,
    selected: games.includes(g),
    onClick: () => toggle(g)
  }, g))), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      marginTop: 24,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'inline-flex',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Verificamos tu rango con la API del juego la primera vez que mandes un reto.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onDone,
    disabled: games.length === 0
  }, "Empezar"));
}
function Pad({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 24px 32px',
      gap: 0,
      overflow: 'hidden'
    }
  }, children);
}
function Steps({
  n
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 28
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      height: 3,
      flex: 1,
      background: i <= n ? 'var(--red-500)' : 'var(--surface-raised)',
      borderRadius: 2
    }
  })));
}
Object.assign(window, {
  Onboarding
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Card,
  Badge,
  Tag,
  Avatar,
  Icon,
  IconButton,
  Tabs,
  Select,
  Input,
  Switch,
  ChallengeCard,
  MatchResult,
  TierBadge,
  XPBar,
  PlayerRow,
  StatTile,
  GameTag,
  TIERS
} = window.BecomeALegendDesignSystem_cbebf2;
const ME = {
  name: 'Diego Ruiz',
  handle: 'DiegoR#LAN',
  tier: 'oro'
};
const FRIENDS = [{
  name: 'Ana López',
  handle: 'AnaL#LAN',
  tier: 'gran-maestro',
  record: '31-8'
}, {
  name: 'Sofía Marín',
  handle: 'SofiM#LAN',
  tier: 'plata',
  record: '9-7'
}, {
  name: 'Iván Castro',
  handle: 'IvanC#LAN',
  tier: 'bronce',
  record: '4-6'
}, {
  name: 'Mateo Díaz',
  handle: 'MateoD#LAN',
  tier: 'esmeralda',
  record: '22-11'
}];
function Scroll({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '18px 20px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, children);
}
function FeedScreen({
  challenges,
  onAccept,
  onDecline,
  onOpen
}) {
  const [tab, setTab] = React.useState('activos');
  const shown = challenges.filter(c => tab === 'activos' ? c.status !== 'ganado' : c.status === 'ganado');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'activos',
      label: 'Activos',
      count: challenges.filter(c => c.status !== 'ganado').length
    }, {
      value: 'historial',
      label: 'Historial'
    }]
  })), /*#__PURE__*/React.createElement(Scroll, null, shown.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '64px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-faint)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "swords",
    size: 28
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 14,
      fontSize: 15,
      color: 'var(--text-muted)'
    }
  }, "Ret\xE1 a un amigo para empezar.")) : shown.map(c => c.status === 'ganado' ? /*#__PURE__*/React.createElement(MatchResult, {
    key: c.id,
    score: c.score,
    game: c.game === 'lol' ? 'League of Legends' : 'TFT',
    awarded: "+180 XP \xB7 +50 monedas",
    winner: c.challenger,
    loser: c.opponent
  }) : /*#__PURE__*/React.createElement(ChallengeCard, _extends({
    key: c.id
  }, c, {
    onClick: () => onOpen(c),
    onAccept: c.inbound ? () => onAccept(c) : undefined,
    onDecline: c.inbound ? () => onDecline(c) : undefined
  })))));
}
function CreateScreen({
  onSend
}) {
  const [game, setGame] = React.useState('League of Legends');
  const [stake, setStake] = React.useState('50');
  const [friend, setFriend] = React.useState(FRIENDS[0].name);
  return /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(Select, {
    label: "Juego",
    value: game,
    onChange: setGame,
    options: ['League of Legends', 'TFT']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Cola",
    onChange: () => {},
    options: ['Solo/Duo', 'Flexible', 'Clasificatoria']
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 10
    }
  }, "A qui\xE9n ret\xE1s"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-3)',
      background: 'var(--surface-2)'
    }
  }, FRIENDS.slice(0, 3).map((f, i) => /*#__PURE__*/React.createElement(PlayerRow, {
    key: f.name,
    name: f.name,
    handle: f.handle,
    tier: f.tier,
    onClick: () => setFriend(f.name),
    style: {
      borderBottom: i === 2 ? 0 : undefined,
      background: friend === f.name ? 'var(--red-tint)' : undefined
    },
    right: friend === f.name ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--red-400)',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16
    })) : null
  })))), /*#__PURE__*/React.createElement(Input, {
    label: "Monedas apostadas",
    value: stake,
    onChange: setStake,
    suffix: "de 2 480",
    icon: "coins"
  }), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, "Gana quien gane la partida"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-faint)',
      marginTop: 2
    }
  }, "Verificaci\xF3n autom\xE1tica")), /*#__PURE__*/React.createElement(GameTag, {
    game: game === 'TFT' ? 'tft' : 'lol',
    short: true
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    icon: "swords",
    onClick: () => onSend({
      friend,
      game,
      stake
    })
  }, "Mandar reto"));
}
function RankingScreen() {
  return /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: "oro",
    division: "II",
    size: "lg"
  }), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "#2 de 14 amigos")), /*#__PURE__*/React.createElement(XPBar, {
    value: 12400,
    max: 18000,
    tier: "oro",
    nextTier: "Esmeralda",
    style: {
      marginTop: 22
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Ranking entre amigos"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-3)',
      background: 'var(--surface-2)'
    }
  }, FRIENDS.map((f, i) => /*#__PURE__*/React.createElement(PlayerRow, {
    key: f.name,
    rank: i + 1,
    name: f.name,
    handle: f.handle,
    tier: f.tier,
    record: f.record,
    style: {
      borderBottom: i === FRIENDS.length - 1 ? 0 : undefined
    },
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Retar")
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "La escalera"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, TIERS.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.slug,
    style: {
      padding: '12px 14px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderTop: '2px solid var(--tier-' + t.slug + ')',
      borderRadius: 'var(--radius-card)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: t.slug,
    size: "sm",
    showLabel: false
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, t.label))))));
}
function ProfileScreen() {
  return /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: ME.name,
    size: "xl",
    tier: "oro",
    online: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)'
    }
  }, ME.name), /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-faint)',
      marginTop: 2
    }
  }, ME.handle), /*#__PURE__*/React.createElement(TierBadge, {
    tier: "oro",
    division: "II",
    style: {
      marginTop: 10
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Retos ganados",
    value: "48",
    delta: "+3 esta semana",
    icon: "trophy"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Racha",
    value: "6",
    delta: "Mejor: 11",
    deltaTone: "neutral",
    icon: "flame"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Juegos"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "League of Legends"), /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "TFT"))), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Aceptar retos autom\xE1ticamente",
    description: "Solo de amigos",
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Notificaciones push",
    checked: true,
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "md",
    fullWidth: true
  }, "Cerrar sesi\xF3n"));
}
function DetailScreen({
  challenge,
  onBack,
  onAccept
}) {
  const c = challenge;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left",
    label: "Volver",
    onClick: onBack
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, "Reto")), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(ChallengeCard, c), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [['Juego', c.game === 'lol' ? 'League of Legends' : 'TFT'], ['Cola', c.queue || 'Solo/Duo'], ['Apuesta', (c.stake || 0) + ' monedas'], ['XP en juego', '+' + (c.xp || 180)], ['Expira', 'en 22 h']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      color: 'var(--text-primary)'
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'inline-flex',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "El resultado lo leemos de la API del juego al terminar la partida.")), c.inbound ? /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: () => onAccept(c)
  }, "Aceptar reto") : /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    fullWidth: true
  }, "Recordarle a ", c.opponent.name.split(' ')[0])));
}
Object.assign(window, {
  FeedScreen,
  CreateScreen,
  RankingScreen,
  ProfileScreen,
  DetailScreen,
  ME,
  FRIENDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Shell.jsx
try { (() => {
const {
  CoinChip,
  IconButton,
  Avatar
} = window.BecomeALegendDesignSystem_cbebf2;
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, "21:04"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 10,
      border: '1px solid currentColor',
      borderRadius: 2,
      display: 'inline-block',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 1,
      right: 5,
      background: 'currentColor'
    }
  }))));
}
function AppHeader({
  title,
  coins = 2480,
  xp = 12400,
  level = 37,
  onProfile
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      padding: '4px 20px 14px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 0.95,
      letterSpacing: '-0.03em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)'
    }
  }, "Become", /*#__PURE__*/React.createElement("br", null), "a Legend"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(CoinChip, {
    amount: coins,
    xp: xp,
    level: level
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Notificaciones"
  }))), title ? /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 18,
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      color: 'var(--text-primary)'
    }
  }, title) : null);
}
function Phone({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 844,
      background: 'var(--bg-canvas)',
      borderRadius: 4,
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }
  }, children);
}
Object.assign(window, {
  StatusBar,
  AppHeader,
  Phone
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Panels.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Card,
  Badge,
  Tabs,
  Select,
  Input,
  IconButton,
  CoinChip,
  Icon,
  ChallengeCard,
  MatchResult,
  PlayerRow,
  StatTile,
  XPBar,
  TierBadge,
  Tag
} = window.BecomeALegendDesignSystem_cbebf2;
function TopBar({
  theme,
  onTheme,
  onNew
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      flex: '0 0 auto',
      borderBottom: '1px solid var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Buscar amigos o retos",
    onChange: () => {},
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(CoinChip, {
    amount: 2480,
    xp: 12400,
    level: 37
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: theme === 'light' ? 'moon' : 'sun',
    label: "Cambiar tema",
    onClick: onTheme
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Notificaciones"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: onNew
  }, "Nuevo reto"));
}
function FeedPanel({
  items,
  onAccept,
  onDecline
}) {
  const [tab, setTab] = React.useState('activos');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 340px',
      gap: 28,
      padding: 28,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Retos ganados",
    value: "48",
    delta: "+3 esta semana",
    icon: "trophy"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Racha",
    value: "6",
    delta: "Mejor: 11",
    deltaTone: "neutral",
    icon: "flame"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Monedas ganadas",
    value: "1 240",
    delta: "+180 hoy",
    icon: "coins"
  })), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'activos',
      label: 'Activos',
      count: items.filter(i => i.status !== 'ganado').length
    }, {
      value: 'historial',
      label: 'Historial'
    }]
  }), items.filter(i => tab === 'activos' ? i.status !== 'ganado' : i.status === 'ganado').map(c => c.status === 'ganado' ? /*#__PURE__*/React.createElement(MatchResult, {
    key: c.id,
    score: c.score,
    game: "League of Legends",
    awarded: "+180 XP \xB7 +50 monedas",
    winner: c.challenger,
    loser: c.opponent
  }) : /*#__PURE__*/React.createElement(ChallengeCard, _extends({
    key: c.id
  }, c, {
    onAccept: c.inbound ? () => onAccept(c) : undefined,
    onDecline: c.inbound ? () => onDecline(c) : undefined
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: "oro",
    division: "II",
    size: "lg"
  }), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "#2 / 14")), /*#__PURE__*/React.createElement(XPBar, {
    value: 12400,
    max: 18000,
    tier: "oro",
    nextTier: "Esmeralda",
    style: {
      marginTop: 20
    }
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--divider)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow"
  }, "Amigos"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconAfter: "arrow-right"
  }, "Ver todos")), /*#__PURE__*/React.createElement(PlayerRow, {
    name: "Ana L\xF3pez",
    handle: "AnaL#LAN",
    tier: "gran-maestro",
    record: "31-8",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Retar")
  }), /*#__PURE__*/React.createElement(PlayerRow, {
    name: "Mateo D\xEDaz",
    handle: "MateoD#LAN",
    tier: "esmeralda",
    record: "22-11",
    online: true,
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Retar")
  }), /*#__PURE__*/React.createElement(PlayerRow, {
    name: "Sof\xEDa Mar\xEDn",
    handle: "SofiM#LAN",
    tier: "plata",
    record: "9-7",
    style: {
      borderBottom: 0
    },
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Retar")
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-eyebrow"
  }, "Juegos"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "League of Legends"), /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "TFT")))));
}
function ComposerPanel({
  onSend
}) {
  const [friend, setFriend] = React.useState('Ana López');
  const [stake, setStake] = React.useState('50');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      color: 'var(--text-primary)'
    }
  }, "Nuevo reto"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 15,
      color: 'var(--text-muted)'
    }
  }, "1v1. Gana quien gane la partida. El resultado se verifica solo."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Juego",
    options: ['League of Legends', 'TFT'],
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Cola",
    options: ['Solo/Duo', 'Flexible', 'Clasificatoria'],
    onChange: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 10
    }
  }, "A qui\xE9n ret\xE1s"), /*#__PURE__*/React.createElement(Card, {
    padding: "none"
  }, ['Ana López', 'Mateo Díaz', 'Sofía Marín'].map((n, i) => /*#__PURE__*/React.createElement(PlayerRow, {
    key: n,
    name: n,
    handle: n.split(' ')[0] + '#LAN',
    tier: ['gran-maestro', 'esmeralda', 'plata'][i],
    onClick: () => setFriend(n),
    style: {
      borderBottom: i === 2 ? 0 : undefined,
      background: friend === n ? 'var(--red-tint)' : undefined
    },
    right: friend === n ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--red-400)',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16
    })) : null
  })))), /*#__PURE__*/React.createElement(Input, {
    label: "Monedas apostadas",
    value: stake,
    onChange: setStake,
    icon: "coins",
    suffix: "de 2 480",
    style: {
      marginTop: 20,
      maxWidth: 280
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    icon: "swords",
    onClick: () => onSend({
      friend,
      stake
    })
  }, "Mandar reto"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg"
  }, "Cancelar")));
}
function RankingPanel() {
  const rows = [['Ana López', 'gran-maestro', '31-8'], ['Mateo Díaz', 'esmeralda', '22-11'], ['Diego Ruiz', 'oro', '14-3'], ['Sofía Marín', 'plata', '9-7'], ['Iván Castro', 'bronce', '4-6'], ['Lucía Peña', 'hierro', '2-9']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      color: 'var(--text-primary)'
    }
  }, "Ranking entre amigos"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 15,
      color: 'var(--text-muted)'
    }
  }, "Temporada 3 \xB7 cierra en 24 d\xEDas"), /*#__PURE__*/React.createElement(Card, {
    padding: "none",
    style: {
      marginTop: 24
    }
  }, rows.map(([n, t, r], i) => /*#__PURE__*/React.createElement(PlayerRow, {
    key: n,
    rank: i + 1,
    name: n,
    handle: n.split(' ')[0] + '#LAN',
    tier: t,
    record: r,
    style: {
      borderBottom: i === rows.length - 1 ? 0 : undefined,
      background: n === 'Diego Ruiz' ? 'var(--surface-3)' : undefined
    },
    right: n === 'Diego Ruiz' ? /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Vos") : /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Retar")
  }))));
}
Object.assign(window, {
  TopBar,
  FeedPanel,
  ComposerPanel,
  RankingPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Panels.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Sidebar.jsx
try { (() => {
const {
  Icon,
  Avatar,
  TierBadge
} = window.BecomeALegendDesignSystem_cbebf2;
function Sidebar({
  value,
  onChange
}) {
  const items = [['feed', 'Feed', 'layout-grid'], ['retos', 'Mis retos', 'swords'], ['amigos', 'Amigos', 'users'], ['ranking', 'Ranking', 'trophy'], ['monedas', 'Monedas', 'coins'], ['ajustes', 'Ajustes', 'settings']];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 236,
      flex: '0 0 auto',
      borderRight: '1px solid var(--border-hairline)',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 22px 26px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: 0.95,
      letterSpacing: '-0.03em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)'
    }
  }, "Become", /*#__PURE__*/React.createElement("br", null), "a Legend")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: '0 12px'
    }
  }, items.map(([k, l, ic]) => {
    const on = k === value;
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => onChange(k),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        height: 38,
        padding: '0 10px',
        background: on ? 'var(--surface-3)' : 'transparent',
        border: 0,
        cursor: 'pointer',
        borderRadius: 'var(--radius-2)',
        color: on ? 'var(--text-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: on ? 600 : 500,
        textAlign: 'left',
        transition: 'var(--transition-color)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 17
    }), l);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderTop: '1px solid var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Diego Ruiz",
    tier: "oro"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, "Diego Ruiz"), /*#__PURE__*/React.createElement(TierBadge, {
    tier: "oro",
    size: "sm",
    showLabel: false,
    style: {
      marginTop: 4
    }
  }))));
}
Object.assign(window, {
  Sidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
const {
  Button,
  Badge,
  ChallengeCard
} = window.BecomeALegendDesignSystem_cbebf2;
function Hero({
  onCta
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '96px 40px',
      display: 'grid',
      gridTemplateColumns: '1.05fr .95fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "live",
    dot: true,
    pill: true,
    style: {
      marginBottom: 28
    }
  }, "Temporada 3 \xB7 en vivo"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 76,
      lineHeight: 0.98,
      letterSpacing: '-0.04em',
      color: 'var(--text-primary)',
      margin: 0,
      textWrap: 'pretty'
    }
  }, "Tus amigos.", /*#__PURE__*/React.createElement("br", null), "Tus reglas.", /*#__PURE__*/React.createElement("br", null), "Tu leyenda."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 28,
      fontSize: 19,
      lineHeight: 1.55,
      color: 'var(--text-secondary)',
      maxWidth: '44ch'
    }
  }, "Mand\xE1 un reto 1v1 en League of Legends o TFT. Tu amigo lo acepta, juegan, y el resultado se verifica solo. Sub\xEDs de tier o baj\xE1s."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onCta
  }, "Crear mi cuenta"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    iconAfter: "arrow-right"
  }, "Ver c\xF3mo funciona")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40,
      marginTop: 56
    }
  }, [['48 K', 'retos jugados'], ['10', 'tiers'], ['2', 'juegos']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 26,
      fontWeight: 500,
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow",
    style: {
      marginTop: 4
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(ChallengeCard, {
    game: "lol",
    queue: "Solo/Duo",
    status: "pendiente",
    stake: 50,
    xp: 180,
    meta: "hace 2 h",
    challenger: {
      name: 'Diego Ruiz',
      handle: 'DiegoR#LAN',
      tier: 'oro'
    },
    opponent: {
      name: 'Ana López',
      handle: 'AnaL#LAN',
      tier: 'esmeralda'
    },
    onAccept: () => {},
    onDecline: () => {}
  }), /*#__PURE__*/React.createElement(ChallengeCard, {
    game: "tft",
    queue: "Clasificatoria",
    status: "vivo",
    meta: "partida en curso",
    challenger: {
      name: 'Sofía Marín',
      handle: 'SofiM#LAN',
      tier: 'plata'
    },
    opponent: {
      name: 'Iván Castro',
      handle: 'IvanC#LAN',
      tier: 'bronce'
    }
  }))));
}
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Nav.jsx
try { (() => {
const {
  Button,
  Icon
} = window.BecomeALegendDesignSystem_cbebf2;
function SiteNav({
  onCta
}) {
  const links = ['Cómo funciona', 'Ranking', 'Juegos', 'Precios'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(8,9,10,.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 40px',
      height: 68,
      display: 'flex',
      alignItems: 'center',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: 0.95,
      letterSpacing: '-0.03em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)'
    }
  }, "Become", /*#__PURE__*/React.createElement("br", null), "a Legend"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      flex: 1
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Entrar"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onCta
  }, "Crear cuenta"))));
}
function SiteFooter() {
  const cols = [['Producto', ['Cómo funciona', 'Juegos', 'Ranking', 'Monedas']], ['Comunidad', ['Discord', 'Creadores', 'Torneos']], ['Legal', ['Términos', 'Privacidad', 'Juego responsable']]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-hairline)',
      background: 'var(--bg-base)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '64px 40px 40px',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 0.95,
      letterSpacing: '-0.035em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)'
    }
  }, "Become", /*#__PURE__*/React.createElement("br", null), "a Legend"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 13,
      color: 'var(--text-faint)',
      maxWidth: 260
    }
  }, "Retos 1v1 entre amigos en League of Legends y TFT. Resultados verificados autom\xE1ticamente.")), cols.map(([t, items]) => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow"
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 16
    }
  }, items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, i)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '20px 40px 48px',
      borderTop: '1px solid var(--divider)',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, "\xA9 2026 Become a Legend"), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)'
    }
  }, "No afiliado a Riot Games")));
}
Object.assign(window, {
  SiteNav,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Nav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Sections.jsx
try { (() => {
const {
  Card,
  Icon,
  TierBadge,
  TIERS,
  Button,
  PlayerRow,
  MatchResult
} = window.BecomeALegendDesignSystem_cbebf2;
function SectionHead({
  eyebrow,
  title,
  copy,
  align = 'left'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: align === 'center' ? 640 : 560,
      margin: align === 'center' ? '0 auto' : 0,
      textAlign: align
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bal-eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 16,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 44,
      lineHeight: 1.04,
      letterSpacing: '-0.035em',
      color: 'var(--text-primary)'
    }
  }, title), copy ? /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 18,
      fontSize: 17,
      lineHeight: 1.55,
      color: 'var(--text-muted)'
    }
  }, copy) : null);
}
function HowItWorks() {
  const steps = [['send', 'Mandás el reto', 'Elegís el juego, la cola y cuántas monedas se apuestan.', 'swords'], ['accept', 'Tu amigo acepta', 'Le llega la invitación. Tiene 24 h para aceptarla.', 'user-check'], ['play', 'Juegan la partida', 'Cada uno en su cuenta, en la cola que acordaron.', 'gamepad-2'], ['verify', 'Se verifica solo', 'Leemos el resultado de la API del juego. Nadie reporta nada.', 'shield-check']];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "C\xF3mo funciona",
    title: "Cuatro pasos, cero discusiones.",
    copy: "El reto empieza con un mensaje y termina con un resultado que nadie puede negociar."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20,
      marginTop: 56
    }
  }, steps.map(([k, t, c, ic], i) => /*#__PURE__*/React.createElement(Card, {
    key: k,
    padding: "lg",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--red-500)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    className: "bal-num",
    style: {
      fontSize: 12,
      color: 'var(--text-faint)'
    }
  }, '0' + (i + 1))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      lineHeight: 1.55
    }
  }, c))))));
}
function TierLadder() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: '1px solid var(--border-hairline)',
      background: 'var(--bg-base)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "La escalera",
    title: "Diez tiers. Uno solo importa.",
    copy: "Cada reto ganado te acerca al siguiente. Cada derrota te devuelve al anterior. Gran Maestro se defiende cada temporada."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 12,
      marginTop: 56
    }
  }, TIERS.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.slug,
    style: {
      padding: '20px 18px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderTop: '2px solid var(--tier-' + t.slug + ')',
      borderRadius: 'var(--radius-card)'
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: t.slug,
    showLabel: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, t.label), /*#__PURE__*/React.createElement("div", {
    className: "bal-num",
    style: {
      fontSize: 11,
      color: 'var(--text-faint)',
      marginTop: 2
    }
  }, 'Tier ' + t.level))))));
}
function ProofSection() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '96px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Verificaci\xF3n",
    title: "El resultado no se discute.",
    copy: "Become a Legend lee la partida directamente de la API del juego. No hay capturas, no hay reportes, no hay que confiar en nadie."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Crear mi cuenta"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(MatchResult, {
    score: "14-3",
    game: "League of Legends",
    awarded: "+180 XP \xB7 +50 monedas",
    winner: {
      name: 'Diego Ruiz',
      tier: 'oro'
    },
    loser: {
      name: 'Ana López',
      tier: 'esmeralda'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement(PlayerRow, {
    rank: 1,
    name: "Ana L\xF3pez",
    handle: "AnaL#LAN",
    tier: "gran-maestro",
    record: "31-8"
  }), /*#__PURE__*/React.createElement(PlayerRow, {
    rank: 2,
    name: "Diego Ruiz",
    handle: "DiegoR#LAN",
    tier: "oro",
    record: "14-3",
    online: true
  }), /*#__PURE__*/React.createElement(PlayerRow, {
    rank: 3,
    name: "Sof\xEDa Mar\xEDn",
    handle: "SofiM#LAN",
    tier: "plata",
    record: "9-7",
    style: {
      borderBottom: 0
    }
  })))));
}
function CtaSection({
  onCta
}) {
  return /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '128px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 64,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      color: 'var(--text-primary)'
    }
  }, "Nadie se vuelve", /*#__PURE__*/React.createElement("br", null), "leyenda solo."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px auto 0',
      maxWidth: 520,
      fontSize: 18,
      color: 'var(--text-muted)'
    }
  }, "Cre\xE1 tu cuenta, conect\xE1 tu Riot ID y ret\xE1 al primero de tus amigos."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onCta
  }, "Crear mi cuenta"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg"
  }, "Hablar con nosotros"))));
}
Object.assign(window, {
  SectionHead,
  HowItWorks,
  TierLadder,
  ProofSection,
  CtaSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.ChallengeCard = __ds_scope.ChallengeCard;

__ds_ns.CoinChip = __ds_scope.CoinChip;

__ds_ns.GameTag = __ds_scope.GameTag;

__ds_ns.MatchResult = __ds_scope.MatchResult;

__ds_ns.PlayerRow = __ds_scope.PlayerRow;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.TIERS = __ds_scope.TIERS;

__ds_ns.TierBadge = __ds_scope.TierBadge;

__ds_ns.XPBar = __ds_scope.XPBar;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
