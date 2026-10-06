// Figma get_design_context reference — Slide 1 (cover), node 511:28904. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white.svg
const imgBg = "https://www.figma.com/api/mcp/asset/62f8b9ea-b4fa-4174-9405-65a738aae77a.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/27adc623-acb4-4dba-a146-93d7ca69aaa7.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component1() {
  return (
    <div className="relative size-full" data-node-id="511:28904" style={{ backgroundImage: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)" }} data-name="1">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[71px] left-[calc(50%-729px)] top-[calc(50%-422.5px)] w-[301.75px]" data-node-id="511:28907" data-name="Icon/Logo">
        <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:28907;738:2734">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
        </div>
      </div>
      <div className="[word-break:break-word] absolute font-['Cns_Manrope:Medium'] leading-[0] left-[128px] not-italic text-[120px] text-[color:var(--fixed\/white,white)] top-[401px] tracking-[-3.6px] whitespace-nowrap" data-node-id="511:28908">
        <p className="leading-[1.15] mb-0 whitespace-pre">{`Global money. `}</p>
        <p className="leading-[1.15] whitespace-pre">Faster. Always on.</p>
      </div>
      <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.15] left-[128px] not-italic text-[48px] text-[color:var(--fixed\/white,white)] top-[708px] tracking-[-1.44px] whitespace-pre" data-node-id="511:28909">{`Accept payments   ·   Move cross-border   ·   Trade crypto`}</p>
      <div className="absolute h-[33px] left-[81px] top-[981px] w-[426px]" data-node-id="511:28910" data-name="Strictly Private And Confidential">
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-[color:var(--fixed\/white,white)] tracking-[2.4px] whitespace-nowrap" data-node-id="I511:28910;394:11693">
          Strictly Private And Confidential
        </p>
      </div>
    </div>
  );
}
