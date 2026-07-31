import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArticleRecord, deleteAdminArticle, loadAdminArticles, saveAdminArticle } from "../services/backendApi";

const emptyArticle: Partial<ArticleRecord> = {
  title: "", slug: "", description: "", body: "", author_name: "Kathy Kennedy", category: "Intuition Training",
  call_to_action_label: "Try Intuisity", call_to_action_url: "/", status: "draft"
};

export function AdminArticleEditor({ adminSecret }: { adminSecret: string }) {
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [article, setArticle] = useState<Partial<ArticleRecord>>(emptyArticle);
  const [status, setStatus] = useState("Enter the admin password above to manage articles.");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!adminSecret.trim()) return;
    setLoading(true);
    try {
      setArticles(await loadAdminArticles(adminSecret));
      setStatus("Article library loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Articles could not be loaded.");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [adminSecret]);

  const update = (field: keyof ArticleRecord, value: string) => setArticle((current) => ({
    ...current,
    [field]: field === "slug" ? makeSlug(value) : value,
    ...(field === "title" && !current.id && !current.slug ? { slug: makeSlug(value) } : {})
  }));

  const save = async (publish: boolean) => {
    if (!article.title?.trim() || !article.slug?.trim() || !article.description?.trim() || !article.body?.trim()) {
      Alert.alert("Article is incomplete", "Add a title, web address, search description, and article body.");
      return;
    }
    setLoading(true);
    try {
      const saved = await saveAdminArticle({ ...article, status: publish ? "published" : "draft" }, adminSecret);
      setArticle(saved);
      await refresh();
      const message = publish ? "Your article is published and available to readers." : "Your article was saved as a draft.";
      setStatus(message);
      Alert.alert(publish ? "Article published" : "Draft saved", message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The article could not be saved.";
      setStatus(message);
      Alert.alert("Article was not saved", message);
    } finally { setLoading(false); }
  };

  const remove = () => {
    if (!article.id) return;
    const browserWindow = (globalThis as any).window;
    if (browserWindow?.confirm) {
      if (!browserWindow.confirm("Delete this article? This permanently removes it.")) return;
      deleteAdminArticle(article.id, adminSecret)
        .then(async () => { setArticle(emptyArticle); await refresh(); })
        .catch((error) => Alert.alert("Article was not deleted", error instanceof Error ? error.message : "Please try again."));
      return;
    }
    Alert.alert("Delete this article?", "This permanently removes the article.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteAdminArticle(article.id!, adminSecret); setArticle(emptyArticle); await refresh(); }
        catch (error) { Alert.alert("Article was not deleted", error instanceof Error ? error.message : "Please try again."); }
      } }
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.heading}><Ionicons color="#7555C7" name="newspaper-outline" size={25} /><View style={styles.headingCopy}><Text style={styles.title}>Article publishing</Text><Text style={styles.help}>Write helpful articles, save drafts, and publish searchable information pages.</Text></View></View>
      <View style={styles.toolbar}>
        <Pressable onPress={() => setArticle(emptyArticle)} style={styles.lightButton}><Ionicons color="#7555C7" name="add-outline" size={17} /><Text style={styles.lightButtonText}>New article</Text></Pressable>
        <Pressable disabled={loading} onPress={refresh} style={styles.lightButton}><Ionicons color="#008A94" name="refresh-outline" size={17} /><Text style={styles.lightButtonText}>Refresh</Text></Pressable>
        <Pressable onPress={() => Linking.openURL("https://www.intuisity.com/articles")} style={styles.lightButton}><Ionicons color="#008A94" name="open-outline" size={17} /><Text style={styles.lightButtonText}>View articles</Text></Pressable>
      </View>
      {articles.length > 0 && <View style={styles.list}>{articles.map((item) => <Pressable key={item.id} onPress={() => setArticle(item)} style={[styles.articleRow, article.id === item.id && styles.articleRowSelected]}><View style={styles.headingCopy}><Text style={styles.articleName}>{item.title}</Text><Text style={styles.articleMeta}>{item.status === "published" ? "Published" : "Draft"} · /articles/{item.slug}</Text></View><Ionicons color="#7555C7" name="chevron-forward-outline" size={18} /></Pressable>)}</View>}
      <Field label="Article title" value={article.title || ""} onChangeText={(value) => update("title", value)} placeholder="How to strengthen your intuition" />
      <Field label="Web address" value={article.slug || ""} onChangeText={(value) => update("slug", value)} placeholder="how-to-strengthen-your-intuition" />
      <Field label="Search description" value={article.description || ""} onChangeText={(value) => update("description", value)} placeholder="One or two sentences that explain what readers will learn." multiline />
      <View style={styles.twoColumn}><Field label="Author" value={article.author_name || ""} onChangeText={(value) => update("author_name", value)} placeholder="Kathy Kennedy" compact /><Field label="Category" value={article.category || ""} onChangeText={(value) => update("category", value)} placeholder="Intuition Training" compact /></View>
      <Field label="Article body" value={article.body || ""} onChangeText={(value) => update("body", value)} placeholder={'Write your article here.\n\nUse ## before a section heading.'} multiline body />
      <View style={styles.twoColumn}><Field label="Button wording" value={article.call_to_action_label || ""} onChangeText={(value) => update("call_to_action_label", value)} placeholder="Try Intuisity" compact /><Field label="Button destination" value={article.call_to_action_url || ""} onChangeText={(value) => update("call_to_action_url", value)} placeholder="/" compact /></View>
      <View style={styles.toolbar}><Pressable disabled={loading} onPress={() => save(false)} style={styles.lightButton}><Ionicons color="#7555C7" name="save-outline" size={18} /><Text style={styles.lightButtonText}>Save draft</Text></Pressable><Pressable disabled={loading} onPress={() => save(true)} style={styles.publishButton}><Ionicons color="#FFFFFF" name="cloud-upload-outline" size={18} /><Text style={styles.publishText}>Publish article</Text></Pressable>{article.id ? <Pressable onPress={remove} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></Pressable> : null}</View>
      <Text style={styles.status}>{loading ? "Working..." : status}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, body = false, compact = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; body?: boolean; compact?: boolean }) {
  return <View style={[styles.field, compact && styles.compact]}><Text style={styles.label}>{label}</Text><TextInput autoCapitalize={label === "Web address" ? "none" : "sentences"} multiline={multiline} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9A93AA" style={[styles.input, multiline && styles.multiline, body && styles.bodyInput]} textAlignVertical={multiline ? "top" : "center"} value={value} /></View>;
}

function makeSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }

const styles = StyleSheet.create({ section:{backgroundColor:"#FFFFFF",borderColor:"#DCCFF5",borderRadius:10,borderWidth:1,marginBottom:16,padding:16},heading:{alignItems:"flex-start",flexDirection:"row",gap:10,marginBottom:12},headingCopy:{flex:1},title:{color:"#30264C",fontSize:19,fontWeight:"900"},help:{color:"#706982",fontSize:13,lineHeight:19,marginTop:3},toolbar:{flexDirection:"row",flexWrap:"wrap",gap:8,marginVertical:10},lightButton:{alignItems:"center",backgroundColor:"#F8F5FF",borderColor:"#DCCFF5",borderRadius:8,borderWidth:1,flexDirection:"row",gap:6,minHeight:42,paddingHorizontal:12},lightButtonText:{color:"#6544B8",fontSize:13,fontWeight:"900"},publishButton:{alignItems:"center",backgroundColor:"#6544B8",borderRadius:8,flexDirection:"row",gap:7,minHeight:44,paddingHorizontal:15},publishText:{color:"#FFFFFF",fontSize:14,fontWeight:"900"},deleteButton:{alignItems:"center",borderColor:"#D87979",borderRadius:8,borderWidth:1,justifyContent:"center",minHeight:42,paddingHorizontal:12},deleteText:{color:"#A83232",fontWeight:"900"},list:{gap:6,marginBottom:14},articleRow:{alignItems:"center",backgroundColor:"#FBFAFF",borderColor:"#E7E3F2",borderRadius:8,borderWidth:1,flexDirection:"row",padding:10},articleRowSelected:{backgroundColor:"#F1ECFF",borderColor:"#7555C7"},articleName:{color:"#30264C",fontSize:14,fontWeight:"900"},articleMeta:{color:"#706982",fontSize:11,marginTop:2},field:{marginBottom:11},compact:{flex:1,minWidth:220},label:{color:"#6544B8",fontSize:12,fontWeight:"900",marginBottom:5},input:{backgroundColor:"#F8F7FC",borderColor:"#DAD3E8",borderRadius:8,borderWidth:1,color:"#30264C",fontSize:14,paddingHorizontal:11,paddingVertical:10},multiline:{minHeight:76},bodyInput:{minHeight:260},twoColumn:{flexDirection:"row",flexWrap:"wrap",gap:10},status:{color:"#007C86",fontSize:12,fontWeight:"800",lineHeight:18,marginTop:4} });
