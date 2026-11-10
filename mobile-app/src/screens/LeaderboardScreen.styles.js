import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';
export default StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.cream}, content:{padding:21,paddingBottom:34},
  titleBlock:{marginTop:11,marginBottom:21}, eyebrow:{fontSize:9,letterSpacing:2,color:colors.roast,fontWeight:'800'},
  title:{fontFamily:'Georgia',fontSize:38,lineHeight:42,color:colors.ink,marginTop:9}, subtitle:{fontSize:11,lineHeight:17,color:colors.muted,marginTop:10,maxWidth:310},
  cityPicker:{flexDirection:'row',gap:7,marginBottom:25},cityChip:{paddingHorizontal:10,paddingVertical:9,borderRadius:radius.pill,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper},cityChipActive:{backgroundColor:colors.espresso,borderColor:colors.espresso},cityChipText:{fontSize:9,color:colors.roast,fontWeight:'700'},cityChipTextActive:{color:colors.cream},
  listHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:13},listEyebrow:{fontSize:8,letterSpacing:1.5,color:colors.roast,fontWeight:'800'},listTitle:{fontFamily:'Georgia',fontSize:22,color:colors.ink,marginTop:5},
  loader:{marginVertical:40},rankCard:{flexDirection:'row',alignItems:'center',gap:10,padding:11,marginBottom:9,borderRadius:radius.md,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line},
  rankNumber:{width:31,height:31,borderRadius:11,backgroundColor:'#F1EAE0',alignItems:'center',justifyContent:'center'},rankNumberFirst:{backgroundColor:colors.espresso},rankText:{fontSize:10,color:colors.roast,fontWeight:'800'},rankTextFirst:{color:colors.softGold},
  venuePhoto:{width:47,height:47,borderRadius:12,backgroundColor:colors.line},venuePhotoFallback:{width:47,height:47,borderRadius:12,backgroundColor:'#F1EAE0',alignItems:'center',justifyContent:'center'},venueInfo:{flex:1},venueName:{fontFamily:'Georgia',fontSize:15,color:colors.ink},venueAddress:{fontSize:9,color:colors.muted,marginTop:4},reviewMeta:{fontSize:7,color:colors.roast,letterSpacing:1,fontWeight:'800',marginTop:5},
  scoreBlock:{flexDirection:'row',alignItems:'center',gap:3},score:{fontSize:16,color:colors.ink,fontWeight:'800'},empty:{marginTop:10},submitLink:{height:49,marginTop:13,borderRadius:radius.pill,backgroundColor:colors.softGold,paddingHorizontal:17,flexDirection:'row',alignItems:'center',gap:9},submitLinkText:{flex:1,fontSize:8,color:colors.roast,letterSpacing:1,fontWeight:'800'},scoringNote:{fontSize:9,lineHeight:15,color:colors.muted,marginTop:16,paddingHorizontal:3},
});

