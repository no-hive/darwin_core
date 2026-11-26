import {Badge,Box,Group,Paper,Text} from '@mantine/core';
import {materialSize} from './FindingMaterials';
import {Icon,Source,ui} from './ui';
import type {LocalMaterial,Locale} from './types';
/** Local selections are application UI metadata, never fabricated associatedMedia URLs. */
export function FindingLocalMaterials({files,locale}:{files:LocalMaterial[];locale:Locale}){
 if(!files.length)return null;
 return <Paper withBorder radius="md" p="lg"><Group justify="space-between" mb="md"><Text fw={600}>{ui(locale,'Supporting materials','Materiales de apoyo')}</Text><Badge variant="light">{ui(locale,'Local files','Archivos locales')}</Badge></Group><div className="finding-local-attachments">{files.map(file=><Paper key={file.id} withBorder p="md" radius="md">{file.previewUrl?<img src={file.previewUrl} alt={file.name}/>:<Box mb="sm"><Icon name="record" size={28}/></Box>}<Text size="sm" fw={500}><Source>{file.name}</Source></Text><Text size="sm" c="dimmed" mt={4}>{materialSize(file.size)}</Text>{file.primary&&<Badge mt="sm" variant="light">{ui(locale,'Cover image','Imagen principal')}</Badge>}</Paper>)}</div><Text c="dimmed" size="sm" mt="md">{ui(locale,'Selected on this device, not uploaded. Available until this page is reloaded.','Seleccionados en este dispositivo, sin subir. Disponibles hasta que se recargue la página.')}</Text></Paper>;
}
