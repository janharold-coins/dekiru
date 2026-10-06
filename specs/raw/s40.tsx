// Figma get_design_context reference — Slide 40 (closing), node 511:31657. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// NOTE: base gradient here is the NAVY dark variant (rgb(6,15,31) -> rgb(25,22,22)), not the default dark.
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white-sm.svg
// imgLine2 -> /figma/s40/line-h.svg (2104x2, stroke 2) ; imgLine4 -> /figma/s40/line-v-a.svg (278x2) ; imgLine5 -> /figma/s40/line-v-b.svg (256x2)
const imgBg = "https://www.figma.com/api/mcp/asset/38eea33f-e063-4d9d-a7b6-af3ebb5a8e07.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/81d1a378-8e09-44cd-9539-2b6e761a17b2.svg";
const imgLine2 = "https://www.figma.com/api/mcp/asset/5ce7eb41-2399-495a-88c6-d3d3fe3d340a.svg";
const imgLine4 = "https://www.figma.com/api/mcp/asset/4c1f88b5-4b4a-4c8f-9fee-9e4b55816b03.svg";
const imgLine5 = "https://www.figma.com/api/mcp/asset/35ec1c29-ac2e-45d3-8013-5adf5d5b17f8.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component40() {
  return (
    <div className="relative size-full" data-node-id="511:31657" style={{ backgroundImage: "linear-gradient(139.0856182740788deg, rgb(6, 15, 31) 30.321%, rgb(25, 22, 22) 87.755%)" }} data-name="40">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:31660" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:31660;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <div className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" data-node-id="511:31661" data-name="Strictly Private And Confidential">
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-white tracking-[2.4px] whitespace-nowrap" data-node-id="I511:31661;394:11693">
          Strictly Private And Confidential
        </p>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.15] left-[253px] not-italic text-[240px] text-white top-[421px] tracking-[-7.2px] whitespace-nowrap" data-node-id="511:31662">
        Thank you
      </p>
      <div className="absolute h-0 left-[-385px] top-[655px] w-[2104px]" data-node-id="511:31663">
        <div className="absolute inset-[-2px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-385px] top-[473px] w-[2104px]" data-node-id="511:31664">
        <div className="absolute inset-[-2px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-[-385px] top-[579px] w-[2104px]" data-node-id="511:31665">
        <div className="absolute inset-[-2px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute flex h-[278px] items-center justify-center left-[253px] top-[419px] w-0" data-node-id="511:31666">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[278px]">
            <div className="absolute inset-[-2px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[256px] items-center justify-center left-[1319px] top-[441px] w-0" data-node-id="511:31667">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[256px]">
            <div className="absolute inset-[-2px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
