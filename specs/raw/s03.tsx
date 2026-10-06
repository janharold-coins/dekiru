// Figma get_design_context reference — Slide 3 (section divider L1), node 511:28920. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white-sm.svg
// imgLine2 -> /figma/s03/line-h.svg (1201x1) ; imgLine4 -> /figma/s03/line-v-a.svg (140x1) ; imgLine5 -> /figma/s03/line-v-b.svg (EMPTY 32x32 export: line at x=1094 is not rendered)
// Figma style present: "bgslideblack"
const imgBg = "https://www.figma.com/api/mcp/asset/94ee2ce3-3413-4bb7-beeb-e8f4885e957a.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/fe1a4035-41c2-4a08-b727-4d60e4eb16f3.svg";
const imgLine2 = "https://www.figma.com/api/mcp/asset/d231cfe0-95b7-4bc1-a4be-7acbfba09747.svg";
const imgLine4 = "https://www.figma.com/api/mcp/asset/800fa67a-e118-459d-948b-8ec55762df70.svg";
const imgLine5 = "https://www.figma.com/api/mcp/asset/7a0e7302-e9f5-405d-b155-374ada330a11.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component3() {
  return (
    <div className="relative size-full" data-node-id="511:28920" style={{ backgroundImage: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)" }} data-name="3">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:28922" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:28922;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['TWK_Everett:Regular'] leading-[1.15] left-[103px] not-italic opacity-20 text-[120px] text-white top-[432px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:28923">
        01
      </p>
      <div className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" data-node-id="511:28924" data-name="Strictly Private And Confidential">
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-white tracking-[2.4px] whitespace-nowrap" data-node-id="I511:28924;394:11693">
          Strictly Private And Confidential
        </p>
      </div>
      <div className="absolute h-0 left-[-40px] top-[549px] w-[1201px]" data-node-id="511:28925">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-40px] top-[458px] w-[1201px]" data-node-id="511:28926">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-40px] top-[511px] w-[1201px]" data-node-id="511:28927">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute flex h-[140px] items-center justify-center left-[279px] top-[431px] w-0" data-node-id="511:28928">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[140px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[140px] items-center justify-center left-[1094px] top-[431px] w-0" data-node-id="511:28929">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[140px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLine5} />
          </div>
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.15] left-[279px] not-italic text-[64px] text-white top-[588px] tracking-[-1.92px] whitespace-nowrap" data-node-id="511:28930">
        Who we are, key numbers, licensing, and partners
      </p>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Medium'] leading-[1.15] left-[279px] not-italic text-[120px] text-white top-[432px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:28931">
        About Coins.ph
      </p>
    </div>
  );
}
