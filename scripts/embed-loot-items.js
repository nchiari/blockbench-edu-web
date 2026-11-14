'use strict';
// Regenerate from a pinned Mojang item registry and the matching es_ES resource pack.
// Usage: node scripts/embed-loot-items.js <vanilla-resource-pack-directory>
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),rp=process.argv[2];
const base='https://raw.githubusercontent.com/Mojang/bedrock-samples/v1.26.30.5/metadata/vanilladata_modules/';
async function main() {
    if(!rp)throw new Error('Pass the Vanilla RP 1.26.30 directory.');
    const read=async name=>{const response=await fetch(base+name);if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);return response.text();};
    const [itemsText,blocksText]=await Promise.all([read('mojang-items.json'),read('mojang-blocks.json')]);
    const lang=new Map(fs.readFileSync(path.join(rp,'texts/es_ES.lang'),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).toLowerCase(),l.slice(i+1).split('\t#')[0].replace(/§./g,'').trim()];}));
    const get=(...keys)=>keys.map(k=>lang.get(k.toLowerCase())).find(Boolean);
    const blocks=new Map(JSON.parse(blocksText).data_items.map(x=>[x.name,x.serialization_id]));
    const aliases={evoker:'evocation_illager',mooshroom:'mushroomcow',tropical_fish:'tropicalfish',snow_golem:'snowgolem',iron_golem:'irongolem',magma_cube:'magma_cube',zombie_pigman:'pig_zombie'};
    const special={bone_meal:'item.dye.white.name',cocoa_beans:'item.dye.brown.name',ink_sac:'item.dye.black.name',lapis_lazuli:'item.dye.blue.name',empty_map:'item.emptyMap.name',axolotl_bucket:'item.bucketAxolotl.name',cod_bucket:'item.bucketFish.name',salmon_bucket:'item.bucketSalmon.name',pufferfish_bucket:'item.bucketPuffer.name',tropical_fish_bucket:'item.bucketTropical.name',tadpole_bucket:'item.bucketTadpole.name',lava_bucket:'item.bucketLava.name',water_bucket:'item.bucketWater.name',milk_bucket:'item.milk.name',powder_snow_bucket:'item.bucketPowderSnow.name',banner:'item.banner.white.name',lingering_potion:'entity.lingering_potion.name',splash_potion:'entity.splash_potion.name',disc_fragment_5:'item.disc_fragment.name',oak_fence:'tile.fence.name'};
    const overrides={potion:'Poción',sulfur_cube_bucket:'Cubo con cubo de azufre'};
    Object.assign(special,{bamboo_raft:'item.boat.bamboo.name',bamboo_chest_raft:'item.chest_boat.bamboo.name',dark_oak_boat:'item.boat.big_oak.name',dark_oak_chest_boat:'item.chest_boat.big_oak.name',dark_oak_fence:'tile.darkOakFence.name',dark_oak_planks:'tile.planks.big_oak.name',light_blue_dye:'item.dye.lightBlue.name',light_gray_dye:'item.dye.silver.name',seagrass:'tile.seagrass.seagrass.name'});
    const missing=[];
    const entries=JSON.parse(itemsText).data_items.filter(x=>x.name!=='minecraft:air').map(x=>{
        const short=x.name.slice(10),serial=x.serialization_id;
        let label=overrides[short]||get(special[short]||'',serial+'.name',(blocks.get(x.name)||'')+'.name','item.'+short+'.name','tile.'+short+'.name','item.'+short);
        let match;
        if(!label&&(match=short.match(/^(.+)_spawn_egg$/))) {
            const mob=match[1],alias=aliases[mob]||mob;
            label=get(`item.spawn_egg.entity.${alias}.name`,`item.spawn_egg.entity.${mob}.name`);
            const entity=get(`entity.${alias}.name`,`entity.${mob}.name`);
            if(!label&&entity)label='Huevo generador de '+entity.toLocaleLowerCase('es');
        }
        if(!label&&(match=short.match(/^(.+?)_(chest_boat|boat|chest_raft|raft)$/)))label=get(`item.${match[2]}.${match[1]}.name`);
        if(!label&&(match=short.match(/^(.+)_planks$/)))label=get(`tile.planks.${match[1]}.name`);
        if(!label&&(match=short.match(/^(.+)_fence$/)))label=get(`tile.${match[1]}Fence.name`);
        if(!label&&(match=short.match(/^(.+)_dye$/)))label=get(`item.dye.${match[1]}_new.name`,`item.dye.${match[1]}.name`);
        if(!label&&(match=short.match(/^(.+)_head$/)))label=get(`item.skull.${match[1]}.name`);
        if(!label&&short==='skeleton_skull')label=get('item.skull.skeleton.name');
        if(!label&&short==='wither_skeleton_skull')label=get('item.skull.wither.name');
        if(!label&&short.startsWith('music_disc_')) {const title=get(serial+'.desc');if(title)label='Disco de música: '+title;}
        if(!label){missing.push(short);label=short.replaceAll('_',' ');}
        return {id:x.name,label};
    }).sort((a,b)=>a.label.localeCompare(b.label,'es')||a.id.localeCompare(b.id));
    const snapshot={version:'1.26.30.5',source:base+'mojang-items.json',sha256:crypto.createHash('sha256').update(itemsText).digest('hex'),items:entries};
    fs.writeFileSync(path.join(root,'reference/loot-items.json'),JSON.stringify(snapshot,null,2)+'\n');
    const target=path.join(root,'blockbench_edu.js');let source=fs.readFileSync(target,'utf8');
    const embedded='    // BEGIN EMBEDDED LOOT ITEMS (scripts/embed-loot-items.js)\n    const LOOT_ITEMS = '+JSON.stringify(entries)+';\n    // END EMBEDDED LOOT ITEMS';
    const pattern=/    \/\/ BEGIN EMBEDDED LOOT ITEMS[^\n]*\n[\s\S]*?    \/\/ END EMBEDDED LOOT ITEMS/;
    source=pattern.test(source)?source.replace(pattern,()=>embedded):source.replace('    const PIG_DAMAGE_SOURCES',embedded+'\n    const PIG_DAMAGE_SOURCES');
    fs.writeFileSync(target,source);
    console.log(JSON.stringify({items:entries.length,missing}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
