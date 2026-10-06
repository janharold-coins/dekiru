// Figma get_design_context reference — Slide 8 (section divider L1), node 511:29441. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white-sm.svg
// imgLine2 -> /figma/s08/line-h.svg (1456x1) ; imgLine4 -> /figma/s08/line-v.svg (140x1)
// Figma style present: "bgslideblack"
const imgBg = "https://www.figma.com/api/mcp/asset/d60c9b46-a555-4cd8-8980-4564d03c2cb7.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/faa5fa7e-4213-4ee3-a04a-d0a3d9beb8c9.svg";
const imgLine2 = "https://www.figma.com/api/mcp/asset/604e3f5c-5b67-4a96-9a6d-117765dd0fa2.svg";
const imgLine4 = "https://www.figma.com/api/mcp/asset/844d31e7-dffa-48cd-b6d3-f98378ab2ec2.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component8() {
  return (
    <div className="relative size-full" data-node-id="511:29441" style={{ backgroundImage: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)" }} data-name="8">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:29444" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:29444;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['TWK_Everett:Regular'] leading-[1.15] left-[103px] not-italic opacity-20 text-[120px] text-white top-[432px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:29445">
        02
      </p>
      <div className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" data-node-id="511:29446" data-name="Strictly Private And Confidential">
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-white tracking-[2.4px] whitespace-nowrap" data-node-id="I511:29446;394:11693">
          Strictly Private And Confidential
        </p>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:SemiBold'] leading-[1.15] left-[279px] not-italic text-[120px] text-white top-[432px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:29447">
        Products and Pricing
      </p>
      <div className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[0] left-[279px] not-italic text-[64px] text-white top-[588px] tracking-[-1.28px] whitespace-nowrap" data-node-id="511:29448">
        <p className="leading-[1.4] mb-0">Accept payments, move money cross-border,</p>
        <p className="leading-[1.4]">and trade crypto</p>
      </div>
      <div className="absolute h-0 left-[-40px] top-[549px] w-[1456px]" data-node-id="511:29449">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-40px] top-[458px] w-[1456px]" data-node-id="511:29450">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-40px] top-[511px] w-[1456px]" data-node-id="511:29451">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute flex h-[140px] items-center justify-center left-[279px] top-[431px] w-0" data-node-id="511:29452">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[140px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[140px] items-center justify-center left-[1389px] top-[431px] w-0" data-node-id="511:29453">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[140px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
