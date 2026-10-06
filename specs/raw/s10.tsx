// Figma get_design_context reference — Slide 10 (section divider L2), node 511:29476. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white-sm.svg
// imgLine2 -> /figma/s10/line-h.svg (728x0.5) ; imgLine6 -> /figma/s10/line-h-mid.svg (728x0.5) ; imgLine4 -> /figma/s10/line-v.svg (70x0.5)
// Figma style present: "bgslideblack"
const imgBg = "https://www.figma.com/api/mcp/asset/440b4c8a-e954-4d52-9da1-5053e656f318.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/ba48a8aa-cefe-4048-89c9-901c3c76574a.svg";
const imgLine2 = "https://www.figma.com/api/mcp/asset/426f799f-995d-488e-9d23-dd7078f59e6d.svg";
const imgLine6 = "https://www.figma.com/api/mcp/asset/d63f4cf3-e590-4355-bc51-82b58bf94675.svg";
const imgLine4 = "https://www.figma.com/api/mcp/asset/86e0173e-9562-4767-8545-8cc5ae87a539.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component10() {
  return (
    <div className="relative size-full" data-node-id="511:29476" style={{ backgroundImage: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)" }} data-name="10">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="511:29479" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:29479;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['TWK_Everett:Regular'] leading-[1.15] left-[71.5px] not-italic opacity-20 text-[60px] text-white top-[252.5px] tracking-[-1.8px] whitespace-nowrap" data-node-id="511:29480">
        02
      </p>
      <div className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" data-node-id="511:29481" data-name="Strictly Private And Confidential">
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-white tracking-[2.4px] whitespace-nowrap" data-node-id="I511:29481;394:11693">
          Strictly Private And Confidential
        </p>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.15] left-[159.5px] not-italic opacity-60 text-[60px] text-white top-[252.5px] tracking-[-1.8px] whitespace-nowrap" data-node-id="511:29482">
        Products and Pricing
      </p>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:SemiBold'] leading-[1.15] left-[150px] not-italic text-[120px] text-white top-[472px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:29483">
        Pay / Payments
      </p>
      <div className="absolute h-0 left-0 top-[311px] w-[728px]" data-node-id="511:29484">
        <div className="absolute inset-[-0.5px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-0 top-[265.5px] w-[728px]" data-node-id="511:29485">
        <div className="absolute inset-[-0.5px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine2} />
        </div>
      </div>
      <div className="absolute h-0 left-0 top-[292px] w-[728px]" data-node-id="511:29486">
        <div className="absolute inset-[-0.5px_0_0_0]">
          <img alt="" className="block max-w-none size-full" src={imgLine6} />
        </div>
      </div>
      <div className="absolute flex h-[70px] items-center justify-center left-[159.5px] top-[252px] w-0" data-node-id="511:29487">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[70px]">
            <div className="absolute inset-[-0.5px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[70px] items-center justify-center left-[728px] top-[252px] w-0" data-node-id="511:29488">
        <div className="-rotate-90 flex-none">
          <div className="h-0 relative w-[70px]">
            <div className="absolute inset-[-0.5px_0_0_0]">
              <img alt="" className="block max-w-none size-full" src={imgLine4} />
            </div>
          </div>
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-[57.59%_19.48%_36.2%_7.81%] leading-[1.4] not-italic text-[48px] text-white tracking-[-0.72px] whitespace-nowrap" data-node-id="511:29489">
        Receive, send, and manage. Every payment through one platform.
      </p>
    </div>
  );
}
