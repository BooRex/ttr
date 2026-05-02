import { t, type Lang } from "../lib/i18n";
import { getLogoSrc } from "../lib/logoAssets";
import { CardChip } from "./CardChip";

type Props = {
  open: boolean;
  lang: Lang;
  onClose: () => void;
};

export const GameTutorialModal = ({ open, lang, onClose }: Props) => {
  if (!open) return null;

  return (
    <div className="events-modal" role="dialog" aria-modal="true" aria-label={t(lang, "ui.tutorialTitle")}>
      <div className="events-modal-head">
        <h3>{t(lang, "ui.tutorialTitle")}</h3>
        <button type="button" onClick={onClose}>{t(lang, "ui.close")}</button>
      </div>

      <div className="events-scroll-area text-slate-200">
        <div className="mb-3 flex items-center justify-start">
          <img
            src={getLogoSrc(lang)}
            alt="tutorial logo"
            className="w-auto max-w-full object-contain"
            style={{ height: "150px" }}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 mb-3 space-y-2 text-sm leading-5">
          <p><strong>{t(lang, "ui.tutorialGoalTitle")}</strong> — {t(lang, "ui.tutorialGoalBody")}</p>
          <p><strong>{t(lang, "ui.tutorialTurnTitle")}</strong> — {t(lang, "ui.tutorialTurnBody")}</p>
          <p className="text-slate-300">{t(lang, "ui.tutorialSimpleRule")}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 mb-3 space-y-2 text-sm leading-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t(lang, "ui.tutorialActionsTitle")}</p>
          <p>{t(lang, "ui.tutorialActionDraw")}</p>
          <p>{t(lang, "ui.tutorialActionClaim")}</p>
          <p>{t(lang, "ui.tutorialActionStation")}</p>
          <p>{t(lang, "ui.tutorialActionDest")}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 mb-3 space-y-3 text-sm leading-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t(lang, "ui.tutorialExamplesTitle")}</p>

          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">{t(lang, "ui.tutorialExampleClaim3Title")}</p>
            <p className="text-slate-300">{t(lang, "ui.tutorialExampleClaim3Body")}</p>
            <div className="flex items-center gap-2">
              <CardChip color="blue" size="sm" />
              <CardChip color="blue" size="sm" />
              <CardChip color="locomotive" size="sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">{t(lang, "ui.tutorialExampleGrayTitle")}</p>
            <p className="text-slate-300">{t(lang, "ui.tutorialExampleGrayBody")}</p>
            <div className="flex items-center gap-2">
              <CardChip color="red" size="sm" />
              <CardChip color="red" size="sm" />
              <CardChip color="red" size="sm" />
              <CardChip color="red" size="sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">{t(lang, "ui.tutorialExampleSpecialTitle")}</p>
            <p className="text-slate-300">{t(lang, "ui.tutorialExampleSpecialBody")}</p>
            <div className="flex items-center gap-2">
              <CardChip color="green" size="sm" />
              <CardChip color="green" size="sm" />
              <CardChip color="locomotive" size="sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 space-y-2 text-sm leading-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t(lang, "ui.tutorialTipsTitle")}</p>
          <p>{t(lang, "ui.tutorialTipCards")}</p>
          <p>{t(lang, "ui.tutorialTipRoutes")}</p>
          <p>{t(lang, "ui.tutorialTipEvents")}</p>
        </div>

        <div className="rounded-xl border border-emerald-700/70 bg-emerald-950/40 p-3 mt-3 space-y-1.5 text-sm leading-5">
          <p className="text-xs uppercase tracking-wide text-emerald-300">{t(lang, "ui.tutorialChecklistTitle")}</p>
          <p>{t(lang, "ui.tutorialChecklist1")}</p>
          <p>{t(lang, "ui.tutorialChecklist2")}</p>
          <p>{t(lang, "ui.tutorialChecklist3")}</p>
        </div>
      </div>
    </div>
  );
};

